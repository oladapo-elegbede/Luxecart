import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate';
import {
  getStats,
  listUsers,
  getUserDetails,
  setUserSuspension,
  listOrders,
  getOrderDetails,
  changeOrderStatus,
} from './admin.controller';

/**
 * Admin Routes.
 *
 * ALL routes require authentication AND ADMIN role.
 * Routes prefixed with /admin in app.ts.
 *
 * DASHBOARD:
 *   GET    /admin/stats                  Dashboard KPIs
 *
 * USER MANAGEMENT:
 *   GET    /admin/users                  List all users (search/filter)
 *   GET    /admin/users/:id              Get user details
 *   PATCH  /admin/users/:id/suspend      Suspend/unsuspend user
 *
 * ORDER MANAGEMENT:
 *   GET    /admin/orders                 List ALL orders (cross-user)
 *   GET    /admin/orders/:id             Get order details with customer info
 *   PATCH  /admin/orders/:id/status      Update order status (auto-notifies)
 */

const router: ExpressRouter = Router();

// Apply auth + admin role check to ALL routes in this module
router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/stats', getStats);

// User management
router.get('/users', listUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/suspend', setUserSuspension);

// Order management
router.get('/orders', listOrders);
router.get('/orders/:id', getOrderDetails);
router.patch('/orders/:id/status', changeOrderStatus);

export default router;