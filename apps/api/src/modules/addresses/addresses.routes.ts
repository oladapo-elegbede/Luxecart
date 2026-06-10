import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  listMyAddresses,
  getOneAddress,
  createMyAddress,
  updateMyAddress,
  deleteMyAddress,
  setMyDefaultAddress,
} from './addresses.controller';

/**
 * Addresses Routes.
 *
 * All routes prefixed with /addresses in app.ts.
 * All routes require authentication.
 *
 * REST conventions:
 *   GET    /addresses           List all (of mine)
 *   POST   /addresses           Create new
 *   GET    /addresses/:id       Get one
 *   PATCH  /addresses/:id       Update one
 *   DELETE /addresses/:id       Delete one
 *   PATCH  /addresses/:id/default   Set as default (custom action)
 */

const router: ExpressRouter = Router();

// Collection endpoints
router.get('/', authenticate, listMyAddresses);
router.post('/', authenticate, createMyAddress);

// Item endpoints
router.get('/:id', authenticate, getOneAddress);
router.patch('/:id', authenticate, updateMyAddress);
router.delete('/:id', authenticate, deleteMyAddress);

// Custom action endpoint
router.patch('/:id/default', authenticate, setMyDefaultAddress);

export default router;