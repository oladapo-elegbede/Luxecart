import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { sendError } from '../shared/helpers/response';
import { env } from '../config/env';

/**
 * Global Error Handler Middleware.
 *
 * Express recognizes this as an error handler because it has 4 parameters
 * (err, req, res, next). This is a CRITICAL distinction — without 4 params,
 * Express treats it as a regular middleware.
 *
 * MUST be registered LAST in app.ts, after all routes.
 *
 * RESPONSIBILITIES:
 * 1. Format known errors (AppError instances) using our standard response
 * 2. Log unexpected errors for debugging
 * 3. Hide internal error details in production (security)
 * 4. Always return JSON (never let Express's default HTML error page show)
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // ─────────────────────────────────────────
  // Known errors (AppError and subclasses)
  // ─────────────────────────────────────────
  if (err instanceof AppError) {
    // Log operational errors only in development
    if (env.NODE_ENV === 'development') {
      console.warn(`[${err.code}] ${err.message}`);
    }

    // Build error response, only including 'errors' field if details exist
    const errorDetails = Array.isArray(err.details)
      ? (err.details as Array<{ field?: string; message: string }>)
      : null;

    if (errorDetails && errorDetails.length > 0) {
      sendError(res, {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        errors: errorDetails,
      });
    } else {
      sendError(res, {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
      });
    }
    return;
  }

  // ─────────────────────────────────────────
  // Unexpected errors (programming bugs, etc.)
  // ─────────────────────────────────────────

  // Always log unexpected errors — these are real problems
  console.error('Unexpected error:', err);

  sendError(res, {
    message:
      env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again.'
        : err.message,
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  });
}