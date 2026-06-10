import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  register,
  login,
  refresh,
  logout,
  me,
} from './auth.controller';

/**
 * Authentication Routes.
 *
 * Maps URL paths to controller functions.
 * All routes here are prefixed with /auth in app.ts.
 *
 * Public routes (no auth required):
 *   POST /auth/register   — Create new account
 *   POST /auth/login      — Authenticate
 *   POST /auth/refresh    — Get new access token from refresh cookie
 *   POST /auth/logout     — Revoke refresh token
 *
 * Protected routes (auth required):
 *   GET  /auth/me         — Get current user profile
 */

const router: ExpressRouter = Router();

// ─────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// ─────────────────────────────────────────
// Protected Routes (require valid access token)
// ─────────────────────────────────────────

router.get('/me', authenticate, me);

export default router;