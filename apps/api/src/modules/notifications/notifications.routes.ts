import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  getMyNotifications,
  getMyUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteMyNotification,
  clearMyNotifications,
} from './notifications.controller';

/**
 * Notifications Routes.
 *
 * All routes prefixed with /notifications in app.ts.
 * ALL routes require authentication.
 *
 * REST design:
 *   GET    /notifications              List notifications
 *   DELETE /notifications              Clear all
 *   GET    /notifications/unread-count Get unread count (for bell badge)
 *   PATCH  /notifications/read-all     Mark all as read
 *   PATCH  /notifications/:id/read     Mark one as read
 *   DELETE /notifications/:id          Delete one
 *
 * ROUTE ORDER MATTERS:
 *   /unread-count and /read-all must come BEFORE /:id routes
 *   Otherwise Express would treat "unread-count" as an ID
 */

const router: ExpressRouter = Router();

// Specific routes (must come before /:id)
router.get('/unread-count', authenticate, getMyUnreadCount);
router.patch('/read-all', authenticate, markAllNotificationsAsRead);

// Collection routes
router.get('/', authenticate, getMyNotifications);
router.delete('/', authenticate, clearMyNotifications);

// Item routes
router.patch('/:id/read', authenticate, markNotificationAsRead);
router.delete('/:id', authenticate, deleteMyNotification);

export default router;