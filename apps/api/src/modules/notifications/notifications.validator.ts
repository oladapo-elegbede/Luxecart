import { z } from 'zod';

/**
 * Notifications Validators.
 *
 * Customer endpoints are READ-ONLY from API perspective:
 *   - List notifications
 *   - Get unread count
 *   - Mark as read / unread
 *   - Delete notification
 *
 * Notifications are CREATED by other modules (orders, reviews, admin actions).
 * No public POST endpoint — only internal createNotification() service.
 */

/**
 * Notification type enum (matches Prisma).
 */
const notificationTypeEnum = z.enum([
  'ORDER_UPDATE',
  'PROMOTION',
  'REVIEW_RESPONSE',
  'SYSTEM',
]);

/**
 * Notification ID validator (for URL params).
 */
export const notificationIdSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

/**
 * List notifications query validator.
 *
 * Supports:
 *   - Filtering by unread only
 *   - Filtering by notification type
 *   - Pagination
 */
export const listNotificationsQuerySchema = z.object({
  unreadOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((val) => val === 'true'),

  type: notificationTypeEnum.optional(),

  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(10000)
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
});

/**
 * TypeScript type inferred from the schema.
 */
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;