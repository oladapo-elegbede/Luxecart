import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  getProductReviews,
  getMyReviews,
  createNewReview,
  updateMyReview,
  deleteMyReview,
} from './reviews.controller';

/**
 * Reviews Routes.
 *
 * All routes prefixed with /reviews in app.ts.
 *
 * PUBLIC ROUTES:
 *   GET    /reviews/product/:productId   View reviews for a product
 *
 * AUTHENTICATED ROUTES:
 *   GET    /reviews/me                   My reviews
 *   POST   /reviews                      Create review
 *   PATCH  /reviews/:id                  Update my review
 *   DELETE /reviews/:id                  Delete my review
 *
 * ROUTE ORDER MATTERS:
 *   /me and /product/:productId are specific routes — must come BEFORE
 *   the generic /:id routes (PATCH/DELETE).
 */

const router: ExpressRouter = Router();

// Public route
router.get('/product/:productId', getProductReviews);

// Authenticated routes
router.get('/me', authenticate, getMyReviews);
router.post('/', authenticate, createNewReview);
router.patch('/:id', authenticate, updateMyReview);
router.delete('/:id', authenticate, deleteMyReview);

export default router;