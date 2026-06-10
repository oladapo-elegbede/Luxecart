import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  deleteMyAccount,
} from './users.controller';

/**
 * Users Routes.
 *
 * All routes here are prefixed with /users in app.ts.
 * ALL routes require authentication (no public routes).
 *
 * The /me pattern is REST best practice:
 *   - /users/me           — The current user (whoever sent the request)
 *   - /users/:id          — A specific user (admin only, in admin module later)
 *
 * Why /me instead of /users/:id?
 *   - URLs don't expose the user's ID in browser history
 *   - Clean intent: "this is about ME, not user X"
 *   - Industry standard (GitHub uses /user, Google uses /me, etc.)
 */

const router: ExpressRouter = Router();

// All routes require authentication
router.get('/me', authenticate, getMyProfile);
router.patch('/me', authenticate, updateMyProfile);
router.patch('/me/password', authenticate, changeMyPassword);
router.delete('/me', authenticate, deleteMyAccount);

export default router;