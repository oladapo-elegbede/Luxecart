import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  listUsersQuerySchema,
  listAllOrdersQuerySchema,
  updateUserStatusSchema,
  updateOrderStatusSchema,
  userIdParamSchema,
  orderIdParamSchema,
} from './admin.validator';
import {
  getDashboardStats,
  listAllUsers,
  getUserByIdAdmin,
  updateUserStatus,
  listAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
} from './admin.service';

/**
 * Admin Controller.
 *
 * ALL endpoints require ADMIN role (enforced in routes).
 * This is where admin/store-owner actions live.
 */

/**
 * GET /api/v1/admin/stats
 * Dashboard statistics for admin home page.
 */
export async function getStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getDashboardStats();

    sendSuccess(res, {
      message: 'Dashboard stats retrieved successfully',
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/users
 * List all users with search, role filter, suspension filter, pagination.
 */
export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid query parameters', errors);
    }

    const result = await listAllUsers(parsed.data);

    sendSuccess(res, {
      message: 'Users retrieved successfully',
      data: { users: result.users },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/users/:id
 * Get full user details (admin view).
 */
export async function getUserDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = userIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid user ID');
    }

    const user = await getUserByIdAdmin(parsed.data.id);

    sendSuccess(res, {
      message: 'User retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/users/:id/suspend
 * Suspend or unsuspend a user account.
 */
export async function setUserSuspension(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const paramParsed = userIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new ValidationError('Invalid user ID');
    }

    const bodyParsed = updateUserStatusSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      const errors = bodyParsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const user = await updateUserStatus(paramParsed.data.id, bodyParsed.data);

    sendSuccess(res, {
      message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/orders
 * List ALL orders across all users with filtering and pagination.
 */
export async function listOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listAllOrdersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid query parameters', errors);
    }

    const result = await listAllOrders(parsed.data);

    sendSuccess(res, {
      message: 'Orders retrieved successfully',
      data: { orders: result.orders },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/orders/:id
 * Get full order details (admin view with user info).
 */
export async function getOrderDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = orderIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid order ID');
    }

    const order = await getOrderByIdAdmin(parsed.data.id);

    sendSuccess(res, {
      message: 'Order retrieved successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/orders/:id/status
 * Update order status (PROCESSING, SHIPPED, DELIVERED, etc.).
 * Auto-sends notification to customer.
 */
export async function changeOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const paramParsed = orderIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new ValidationError('Invalid order ID');
    }

    const bodyParsed = updateOrderStatusSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      const errors = bodyParsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const order = await updateOrderStatus(paramParsed.data.id, bodyParsed.data);

    sendSuccess(res, {
      message: 'Order status updated successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}