import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Rate Limiters.
 *
 * Different endpoints need different rate limits:
 *   - Auth (login/register) — strict, prevent brute force
 *   - Forgot password/resend verification — strict, prevent email spam
 *   - General API — generous, just prevent abuse
 *
 * USAGE:
 *   import { authLimiter } from '@/middleware/rate-limiter';
 *   router.post('/login', authLimiter, login);
 *
 * IMPLEMENTATION:
 *   Uses in-memory storage (per-instance). For production with
 *   multiple servers, swap to Redis store. The logic stays identical.
 *
 * RESPONSES:
 *   When limit exceeded:
 *     HTTP 429 Too Many Requests
 *     Headers: RateLimit-* show current quota
 *     Body: Standardized error JSON
 */

/**
 * Standard error response when rate limit is hit.
 * Matches our app's API response format.
 */
function rateLimitHandler(_req: Request, res: Response): void {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  });
}

/**
 * Auth Limiter — for login, register, refresh.
 *
 * 5 requests per 15 minutes per IP.
 * Strict because these are brute-force targets.
 *
 * Skips successful requests (logged in users shouldn't be punished
 * for rapid legitimate refreshes).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  message: 'Too many authentication attempts. Please wait 15 minutes.',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler,
});

/**
 * Email Limiter — for forgot-password, resend-verification.
 *
 * 3 requests per hour per IP.
 * Very strict to prevent email spam attacks.
 * (Attackers can't use your API to spam other people's inboxes.)
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  message: 'Too many email requests. Please wait an hour.',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * General API Limiter — for all other endpoints.
 *
 * 100 requests per minute per IP.
 * Generous, just protects against abuse.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  message: 'Too many requests. Please slow down.',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});