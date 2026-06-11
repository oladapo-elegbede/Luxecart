import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
  clearMyWishlist,
} from './wishlist.controller';

/**
 * Wishlist Routes.
 *
 * All routes prefixed with /wishlist in app.ts.
 * ALL routes require authentication.
 *
 * REST design:
 *   GET    /wishlist                    Get my wishlist
 *   DELETE /wishlist                    Clear my wishlist
 *   POST   /wishlist/items              Add item
 *   DELETE /wishlist/items/:itemId      Remove item
 *
 * Note: No PATCH endpoint — there's nothing to update.
 * Wishlist items have no quantity or other modifiable fields.
 */

const router: ExpressRouter = Router();

// Wishlist-level operations
router.get('/', authenticate, getMyWishlist);
router.delete('/', authenticate, clearMyWishlist);

// Item-level operations
router.post('/items', authenticate, addToWishlist);
router.delete('/items/:itemId', authenticate, removeFromWishlist);

export default router;