import { prisma } from '../../config/database';
import {
  NotFoundError,
  AuthorizationError,
} from '../../shared/errors/HttpError';
import { paginate } from '../../shared/helpers/response';
import type { ListNotificationsQuery } from './notifications.validator';
import type { Prisma, NotificationType } from '@prisma/client';

/**
 * Notifications Service.
 *
 * Handles all notification operations.
 *
 * PUBLIC FUNCTIONS (called by other services):
 *   - createNotification — When an event happens, create a notification
 *
 * USER-FACING FUNCTIONS:
 *   - listMyNotifications
 *   - getUnreadCount
 *   - markAsRead
 *   - markAllAsRead
 *   - deleteNotification
 *   - clearAllNotifications
 */

/**
 * Input shape for createNotification.
 *
 * `data` is a JSON field for additional context.
 * Example: { orderId: 'xxx', trackingNumber: 'YYY' }
 *
 * The frontend uses `data` to construct deep links.
 * E.g., notification with data.orderId becomes a link to /orders/:orderId
 */
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Create a notification for a user.
 *
 * Called by other services (orders, reviews, admin).
 * Not exposed via HTTP endpoint.
 *
 * @example
 *   // From orders service when order ships:
 *   await createNotification({
 *     userId: order.userId,
 *     type: 'ORDER_UPDATE',
 *     title: 'Your order has shipped',
 *     message: `Order ${order.orderNumber} is on the way`,
 *     data: { orderId: order.id, trackingNumber: order.trackingNumber },
 *   });
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: (input.data ?? {}) as Prisma.InputJsonValue,
    },
  });
}

/**
 * List notifications for the current user.
 *
 * Supports filtering by unread + type, and pagination.
 * Sorted by newest first.
 */
export async function listMyNotifications(
  userId: string,
  query: ListNotificationsQuery
) {
  const { unreadOnly, type, page, limit } = query;

  const where: Prisma.NotificationWhereInput = { userId };
  if (unreadOnly) {
    where.isRead = false;
  }
  if (type) {
    where.type = type;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: paginate({ total, page, limit }),
  };
}

/**
 * Get count of unread notifications for the user.
 *
 * Used for the bell icon badge in the UI.
 * Fast query — only counts, doesn't fetch data.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Mark a single notification as read.
 *
 * IDOR-protected: only the recipient can mark their own as read.
 */
export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  if (notification.userId !== userId) {
    throw new AuthorizationError('You cannot modify this notification');
  }

  // Skip update if already read (avoid unnecessary write)
  if (notification.isRead) {
    return;
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Mark all of the user's notifications as read.
 *
 * Bulk operation using updateMany — single query for efficiency.
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return result.count;
}

/**
 * Delete a single notification.
 *
 * IDOR-protected.
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  if (notification.userId !== userId) {
    throw new AuthorizationError('You cannot delete this notification');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });
}

/**
 * Delete all of the user's notifications.
 *
 * Useful for "Clear all" button in the UI.
 */
export async function clearAllNotifications(userId: string): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: { userId },
  });

  return result.count;
}