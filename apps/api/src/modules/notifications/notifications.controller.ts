import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  notificationIdSchema,
  listNotificationsQuerySchema,
} from './notifications.validator';
import {
  listMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from './notifications.service';

/**
 * Notifications Controller.
 *
 * All endpoints require authentication.
 * Users only see and modify their own notifications.
 */

/**
 * GET /api/v1/notifications
 * List the user's notifications with filtering and pagination.
 */
export async function getMyNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = listNotificationsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid query parameters', errors);
    }

    const result = await listMyNotifications(req.user.userId, parsed.data);

    sendSuccess(res, {
      message: 'Notifications retrieved successfully',
      data: { notifications: result.notifications },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/notifications/unread-count
 * Get count of unread notifications.
 * Used for the bell icon badge.
 */
export async function getMyUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const count = await getUnreadCount(req.user.userId);

    sendSuccess(res, {
      message: 'Unread count retrieved successfully',
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read.
 */
export async function markNotificationAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = notificationIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid notification ID');
    }

    await markAsRead(req.user.userId, parsed.data.id);

    sendSuccess(res, {
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notifications/read-all
 * Mark ALL the user's notifications as read.
 */
export async function markAllNotificationsAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const count = await markAllAsRead(req.user.userId);

    sendSuccess(res, {
      message: `${count} notification(s) marked as read`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/notifications/:id
 * Delete a single notification.
 */
export async function deleteMyNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = notificationIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid notification ID');
    }

    await deleteNotification(req.user.userId, parsed.data.id);

    sendSuccess(res, {
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/notifications
 * Clear ALL notifications for the user.
 */
export async function clearMyNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const count = await clearAllNotifications(req.user.userId);

    sendSuccess(res, {
      message: `${count} notification(s) cleared`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}