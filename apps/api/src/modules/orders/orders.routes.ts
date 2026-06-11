import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  listMyOrders,
  createNewOrder,
  getOneOrder,
  cancelMyOrder,
} from './orders.controller';

/**
 * Orders Routes.
 *
 * All routes prefixed with /orders in app.ts.
 * ALL routes require authentication.
 *
 * REST design:
 *   GET    /orders                List my orders (paginated, filterable)
 *   POST   /orders                Create order from my cart
 *   GET    /orders/:id            Get order details
 *   PATCH  /orders/:id/cancel     Cancel my PENDING order
 *
 * Admin order management lives in the admin module (Module 10).
 */

const router: ExpressRouter = Router();

router.get('/', authenticate, listMyOrders);
router.post('/', authenticate, createNewOrder);
router.get('/:id', authenticate, getOneOrder);
router.patch('/:id/cancel', authenticate, cancelMyOrder);

export default router;