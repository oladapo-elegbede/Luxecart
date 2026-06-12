import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from './auth.validator';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification,
} from './auth.service';
import { env } from '../../config/env';

/**
 * Authentication Controller.
 *
 * Thin HTTP layer that wraps the auth service.
 */

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

// ─────────────────────────────────────────
// Helper: zod validation error formatter
// ─────────────────────────────────────────

function formatZodErrors(error: { errors: Array<{ path: (string | number)[]; message: string }> }) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

// ─────────────────────────────────────────
// Register
// ─────────────────────────────────────────

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', formatZodErrors(parsed.error));
    }

    const result = await registerUser(parsed.data);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

    sendSuccess(res, {
      message: 'Account created successfully. Please check your email to verify your account.',
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

// ─────────────────────────────────────────
// Login
// ─────────────────────────────────────────

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', formatZodErrors(parsed.error));
    }

    const result = await loginUser(parsed.data);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

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

// ─────────────────────────────────────────
// Refresh Token
// ─────────────────────────────────────────

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

    if (!refreshToken) {
      throw new ValidationError('Refresh token not provided');
    }

    const result = await refreshAccessToken(refreshToken);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

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

// ─────────────────────────────────────────
// Logout
// ─────────────────────────────────────────

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions);

    sendSuccess(res, {
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────
// Get Current User
// ─────────────────────────────────────────

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
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

// ─────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', formatZodErrors(parsed.error));
    }

    await requestPasswordReset(parsed.data);

    // Always succeed — don't reveal whether email exists
    sendSuccess(res, {
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────
// Reset Password
// ─────────────────────────────────────────

export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', formatZodErrors(parsed.error));
    }

    await resetPassword(parsed.data);

    sendSuccess(res, {
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────
// Verify Email
// ─────────────────────────────────────────

export async function verifyEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', formatZodErrors(parsed.error));
    }

    await verifyEmail(parsed.data);

    sendSuccess(res, {
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────
// Resend Verification
// ─────────────────────────────────────────

export async function resendVerificationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = resendVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', formatZodErrors(parsed.error));
    }

    await resendVerification(parsed.data);

    // Always succeed — don't reveal whether email exists
    sendSuccess(res, {
      message: 'If an account exists with that email, a verification link has been sent.',
    });
  } catch (error) {
    next(error);
  }
}