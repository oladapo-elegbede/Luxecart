import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  createOrderSchema,
  orderIdSchema,
  listOrdersQuerySchema,
} from './orders.validator';
import {
  createOrder,
  getOrderById,
  listOrders,
  cancelOrder,
} from './orders.service';

/**
 * Orders Controller.
 *
 * All endpoints require authentication.
 * Customers only see and manage their own orders (IDOR enforced in service).
 */

/**
 * GET /api/v1/orders
 * List the user's orders with pagination and optional status filter.
 */
export async function listMyOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = listOrdersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid query parameters', errors);
    }

    const result = await listOrders(req.user.userId, parsed.data);

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
 * POST /api/v1/orders
 * Create a new order from the user's cart.
 *
 * This is the MOST IMPORTANT endpoint in the entire backend.
 * It triggers the full transactional purchase flow.
 */
export async function createNewOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const order = await createOrder(req.user.userId, parsed.data);

    sendSuccess(res, {
      message: 'Order created successfully',
      statusCode: 201,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/orders/:id
 * Get full details of a specific order.
 */
export async function getOneOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = orderIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid order ID');
    }

    const order = await getOrderById(req.user.userId, parsed.data.id);

    sendSuccess(res, {
      message: 'Order retrieved successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/orders/:id/cancel
 * Cancel a PENDING order. Restores stock.
 */
export async function cancelMyOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = orderIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid order ID');
    }

    const order = await cancelOrder(req.user.userId, parsed.data.id);

    sendSuccess(res, {
      message: 'Order cancelled successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}