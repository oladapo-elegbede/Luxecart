import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  getMyCart,
  addToCart,
  updateMyCartItem,
  removeMyCartItem,
  clearMyCart,
} from './cart.controller';

/**
 * Cart Routes.
 *
 * All routes prefixed with /cart in app.ts.
 * ALL routes require authentication (no anonymous carts in v1).
 *
 * REST design:
 *   GET    /cart                 Get my cart
 *   DELETE /cart                 Clear my cart
 *   POST   /cart/items           Add item
 *   PATCH  /cart/items/:itemId   Update item quantity
 *   DELETE /cart/items/:itemId   Remove item
 *
 * The cart itself has no ID in URLs — it's always "my cart"
 * (the user's cart, determined from JWT).
 */

const router: ExpressRouter = Router();

// Cart-level operations
router.get('/', authenticate, getMyCart);
router.delete('/', authenticate, clearMyCart);

// Item-level operations
router.post('/items', authenticate, addToCart);
router.patch('/items/:itemId', authenticate, updateMyCartItem);
router.delete('/items/:itemId', authenticate, removeMyCartItem);

export default router;