import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
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
 * PUBLIC ROUTES:
 *   POST   /auth/register              Create new account
 *   POST   /auth/login                 Sign in
 *   POST   /auth/refresh               Refresh access token
 *   POST   /auth/logout                Sign out (revokes refresh token)
 *
 *   POST   /auth/forgot-password       Request password reset email
 *   POST   /auth/reset-password        Set new password using token
 *
 *   POST   /auth/verify-email          Confirm email with token
 *   POST   /auth/resend-verification   Request new verification email
 *
 * PROTECTED ROUTES:
 *   GET    /auth/me                    Get current user profile
 */

const router: ExpressRouter = Router();

// Public — auth flow
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Public — password reset flow
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordHandler);

// Public — email verification flow
router.post('/verify-email', verifyEmailHandler);
router.post('/resend-verification', resendVerificationHandler);

// Protected
router.get('/me', authenticate, me);

export default router;