import { prisma } from '../../config/database';
import {
  NotFoundError,
  ValidationError,
} from '../../shared/errors/HttpError';
import { paginate } from '../../shared/helpers/response';
import { createNotification } from '../notifications/notifications.service';
import type {
  ListUsersQuery,
  ListAllOrdersQuery,
  UpdateUserStatusInput,
  UpdateOrderStatusInput,
} from './admin.validator';
import type { Prisma } from '@prisma/client';

/**
 * Admin Service.
 *
 * Cross-user queries and platform management.
 * All callers must have ADMIN role (enforced by middleware).
 *
 * KEY FEATURES:
 *   1. Dashboard statistics (revenue, orders, users, products)
 *   2. User management (list, view, suspend/unsuspend)
 *   3. Order management (list ALL orders, change status)
 *   4. Automatic notifications when admin updates order status
 */

/**
 * Get dashboard statistics for the admin home page.
 *
 * Returns a snapshot of platform health:
 *   - Total revenue (from PAID orders only)
 *   - Total orders (excluding CANCELLED)
 *   - Total customers (non-admin users)
 *   - Total active products
 *   - Recent orders (last 7 days revenue)
 *   - Low stock products count
 *   - Pending orders count
 */
export async function getDashboardStats() {
  // Calculate "last 7 days" cutoff
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Run all queries in parallel for speed
  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalActiveProducts,
    last7DaysRevenue,
    pendingOrdersCount,
    lowStockCount,
    recentOrders,
  ] = await Promise.all([
    // Total revenue from successful orders
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true },
    }),

    // Total orders (exclude cancelled)
    prisma.order.count({
      where: { status: { not: 'CANCELLED' } },
    }),

    // Total customers (non-admin users)
    prisma.user.count({
      where: { role: 'CUSTOMER' },
    }),

    // Total active products
    prisma.product.count({
      where: { status: 'ACTIVE' },
    }),

    // Revenue in last 7 days
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: { total: true },
    }),

    // Pending orders awaiting action
    prisma.order.count({
      where: { status: 'PENDING' },
    }),

    // Products below their lowStockThreshold
    prisma.product.count({
      where: {
        status: 'ACTIVE',
        stock: { lte: 10 }, // Using a fixed threshold for simplicity
      },
    }),

    // 5 most recent orders for the dashboard table
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    revenue: {
      total: Number(totalRevenue._sum.total ?? 0),
      last7Days: Number(last7DaysRevenue._sum.total ?? 0),
    },
    counts: {
      totalOrders,
      totalCustomers,
      totalActiveProducts,
      pendingOrders: pendingOrdersCount,
      lowStockProducts: lowStockCount,
    },
    recentOrders,
  };
}

/**
 * List all users (admin view).
 *
 * Supports search by name or email, filtering by role and suspension status.
 * Excludes password from results.
 */
export async function listAllUsers(query: ListUsersQuery) {
  const { search, role, isSuspended, page, limit } = query;

  const where: Prisma.UserWhereInput = {};

  if (role) {
    where.role = role;
  }

  if (isSuspended !== undefined) {
    where.isSuspended = isSuspended;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: paginate({ total, page, limit }),
  };
}

/**
 * Get a single user by ID (admin view).
 *
 * Returns full user details including order count and recent orders.
 */
export async function getUserByIdAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      isSuspended: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          orders: true,
          reviews: true,
          addresses: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

/**
 * Update user suspension status.
 *
 * Admin can suspend or unsuspend a customer.
 * Suspended users cannot log in (checked in auth service).
 *
 * RESTRICTION: Admins cannot suspend other admins via this endpoint.
 * In production this would require super-admin role.
 */
export async function updateUserStatus(
  userId: string,
  input: UpdateUserStatusInput
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.role === 'ADMIN') {
    throw new ValidationError('Admin accounts cannot be suspended');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isSuspended: input.isSuspended },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSuspended: true,
    },
  });
}

/**
 * List ALL orders across all users (admin view).
 *
 * Supports filtering by status, payment status, user.
 * Search applies to order number or customer email.
 */
export async function listAllOrders(query: ListAllOrdersQuery) {
  const { status, paymentStatus, userId, search, page, limit } = query;

  const where: Prisma.OrderWhereInput = {};

  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (userId) where.userId = userId;

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            total: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: paginate({ total, page, limit }),
  };
}

/**
 * Get a single order by ID (admin view).
 *
 * Returns the full order with all relations.
 */
export async function getOrderByIdAdmin(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) {
    throw new NotFoundError('Order');
  }

  return order;
}

/**
 * Update an order's status (admin action).
 *
 * Sets status, optionally tracking number.
 * Auto-sets shippedAt / deliveredAt / cancelledAt based on new status.
 *
 * Creates a notification for the customer about the status change.
 */
export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError('Order');
  }

  // Build update data with auto-set timestamps
  const data: Prisma.OrderUpdateInput = {
    status: input.status,
  };

  if (input.trackingNumber !== undefined) {
    data.trackingNumber =
      input.trackingNumber === '' ? null : input.trackingNumber;
  }

  if (input.status === 'SHIPPED' && !order.shippedAt) {
    data.shippedAt = new Date();
  }

  if (input.status === 'DELIVERED' && !order.deliveredAt) {
    data.deliveredAt = new Date();
  }

  if (input.status === 'CANCELLED' && !order.cancelledAt) {
    data.cancelledAt = new Date();
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data,
  });

  // Send notification to customer about status change
  const statusMessages: Record<string, string> = {
    PROCESSING: 'Your order is being prepared for shipment',
    SHIPPED: `Your order has shipped${
      input.trackingNumber ? ` (tracking: ${input.trackingNumber})` : ''
    }`,
    DELIVERED: 'Your order has been delivered. Enjoy!',
    CANCELLED: 'Your order has been cancelled',
    REFUNDED: 'Your order has been refunded',
  };

  if (statusMessages[input.status]) {
    await createNotification({
      userId: order.userId,
      type: 'ORDER_UPDATE',
      title: `Order ${order.orderNumber}: ${input.status}`,
      message: statusMessages[input.status]!,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    });
  }

  return updatedOrder;
}