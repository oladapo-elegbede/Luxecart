import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate';
import {
  listAllProducts,
  getOneProduct,
  createNewProduct,
  updateExistingProduct,
  deleteExistingProduct,
  getProductByIdAdmin,
} from './products.controller';

/**
 * Products Routes.
 *
 * All routes prefixed with /products in app.ts.
 *
 * PUBLIC ROUTES (no auth):
 *   GET    /products              List all (with filters/search/sort)
 *   GET    /products/:slug        Get one by slug
 *
 * ADMIN ROUTES (auth + authorize('ADMIN')):
 *   GET    /products/admin/:id    Get any product by ID (includes DRAFT)
 *   POST   /products              Create
 *   PATCH  /products/:id          Update
 *   DELETE /products/:id          Soft delete (archive)
 *
 * ROUTE ORDER MATTERS:
 *   /admin/:id MUST come before /:slug
 *   Otherwise Express would match "admin" as a slug.
 */

const router: ExpressRouter = Router();

// ─────────────────────────────────────────
// Admin-specific routes (must come first to avoid conflict with /:slug)
// ─────────────────────────────────────────

router.get(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  getProductByIdAdmin
);

// ─────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────

router.get('/', listAllProducts);
router.get('/:slug', getOneProduct);

// ─────────────────────────────────────────
// Admin Routes (CRUD operations)
// ─────────────────────────────────────────

router.post('/', authenticate, authorize('ADMIN'), createNewProduct);
router.patch('/:id', authenticate, authorize('ADMIN'), updateExistingProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteExistingProduct);

export default router;