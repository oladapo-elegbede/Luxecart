import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter, emailLimiter } from '../../middleware/rate-limiter';
import {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPasswordHandler,
  verifyEmailHandler,
  resendVerificationHandler,
} from './auth.controller';

/**
 * Authentication Routes.
 *
 * All routes prefixed with /auth in app.ts.
 *
 * RATE LIMITS:
 *   - Auth flow (register/login/refresh): 5 per 15 minutes
 *   - Email-sending endpoints: 3 per hour
 *   - Logout, me, verify: no limit (low abuse risk)
 *
 * PUBLIC ROUTES:
 *   POST   /auth/register              Rate-limited
 *   POST   /auth/login                 Rate-limited
 *   POST   /auth/refresh               Rate-limited
 *   POST   /auth/logout                No limit
 *
 *   POST   /auth/forgot-password       Email-limited
 *   POST   /auth/reset-password        No limit (one-time-use token)
 *
 *   POST   /auth/verify-email          No limit (one-time-use token)
 *   POST   /auth/resend-verification   Email-limited
 *
 * PROTECTED ROUTES:
 *   GET    /auth/me                    No limit (already authenticated)
 */

const router: ExpressRouter = Router();

// Public — auth flow (brute-force protected)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);

// Public — password reset flow
router.post('/forgot-password', emailLimiter, forgotPassword);
router.post('/reset-password', resetPasswordHandler);

// Public — email verification flow
router.post('/verify-email', verifyEmailHandler);
router.post('/resend-verification', emailLimiter, resendVerificationHandler);

// Protected
router.get('/me', authenticate, me);

export default router;