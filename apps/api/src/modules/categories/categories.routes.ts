import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate';
import {
  listAllCategories,
  getOneCategory,
  createNewCategory,
  updateExistingCategory,
  deleteExistingCategory,
} from './categories.controller';

/**
 * Categories Routes.
 *
 * All routes prefixed with /categories in app.ts.
 *
 * PUBLIC ROUTES (no auth):
 *   GET    /categories              List all (with filters)
 *   GET    /categories/:slug        Get one by slug
 *
 * ADMIN ROUTES (auth + authorize('ADMIN')):
 *   POST   /categories              Create
 *   PATCH  /categories/:id          Update
 *   DELETE /categories/:id          Delete
 *
 * Note: Public routes use SLUG (URL-friendly), admin routes use ID.
 *   - Customers visit /categories/electronics
 *   - Admins manage via /categories/<uuid>
 */

const router: ExpressRouter = Router();

// ─────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────

router.get('/', listAllCategories);
router.get('/:slug', getOneCategory);

// ─────────────────────────────────────────
// Admin Routes (require ADMIN role)
// ─────────────────────────────────────────

router.post('/', authenticate, authorize('ADMIN'), createNewCategory);
router.patch('/:id', authenticate, authorize('ADMIN'), updateExistingCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteExistingCategory);

export default router;