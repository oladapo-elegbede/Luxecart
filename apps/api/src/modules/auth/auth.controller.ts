import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  registerSchema,
  loginSchema,
} from './auth.validator';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
} from './auth.service';
import { env } from '../../config/env';

/**
 * Authentication Controller.
 *
 * Thin layer that translates HTTP <-> Service.
 * Each function:
 *   1. Parses input from req (body, params, cookies)
 *   2. Validates with Zod schema
 *   3. Calls the service function
 *   4. Sends response or forwards error to error handler
 *
 * Controllers should be SHORT. If you have business logic here,
 * move it to the service.
 */

/**
 * Cookie name for the refresh token.
 *
 * Stored as constant so it's consistent across:
 * - Set in cookie (login, register, refresh)
 * - Read from cookie (refresh, logout)
 * - Cleared (logout)
 */
const REFRESH_TOKEN_COOKIE = 'refreshToken';

/**
 * Cookie configuration for the refresh token.
 *
 * httpOnly: true     — JavaScript can't read it (XSS protection)
 * secure:   prod     — Only sent over HTTPS in production
 * sameSite: 'lax'    — CSRF protection while allowing normal navigation
 * maxAge:   7 days   — Matches our JWT_REFRESH_EXPIRES_IN
 * path:     '/'      — Available to all routes
 */
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
};

/**
 * POST /api/v1/auth/register
 *
 * Register a new user account.
 * Returns user data + access token in body.
 * Sets refresh token as httpOnly cookie.
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validate input
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    // 2. Call service
    const result = await registerUser(parsed.data);

    // 3. Set refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

    // 4. Send response (access token in body, NOT refresh token)
    sendSuccess(res, {
      message: 'Account created successfully',
      statusCode: 201,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 *
 * Authenticate an existing user.
 * Returns user data + access token in body.
 * Sets refresh token as httpOnly cookie.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validate input
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    // 2. Call service
    const result = await loginUser(parsed.data);

    // 3. Set refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

    // 4. Send response
    sendSuccess(res, {
      message: 'Logged in successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/refresh
 *
 * Get a new access token using the refresh token from cookie.
 * Implements refresh token rotation (new refresh token issued, old one revoked).
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Get refresh token from cookie
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;

    if (!refreshToken) {
      throw new ValidationError('Refresh token not provided');
    }

    // 2. Call service
    const result = await refreshAccessToken(refreshToken);

    // 3. Set NEW refresh token cookie (token rotation)
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

    // 4. Send response
    sendSuccess(res, {
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 *
 * Log out the current user.
 * Revokes the refresh token and clears the cookie.
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    // Clear the cookie regardless
    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions);

    sendSuccess(res, {
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 *
 * Get the current authenticated user's profile.
 * Requires authentication (the auth middleware verifies the access token
 * and attaches req.user before this controller runs).
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // req.user is set by the authenticate middleware
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await getCurrentUser(req.user.userId);

    sendSuccess(res, {
      message: 'User profile retrieved',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}