import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from './users.validator';
import {
  getUserById,
  updateProfile,
  changePassword,
  deleteAccount,
} from './users.service';

/**
 * Users Controller.
 *
 * Thin HTTP layer for user profile operations.
 * All endpoints here require authentication (the `authenticate` middleware
 * runs before any of these and attaches req.user).
 */

/**
 * GET /api/v1/users/me
 *
 * Get the current user's profile.
 */
export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await getUserById(req.user.userId);

    sendSuccess(res, {
      message: 'Profile retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/users/me
 *
 * Update the current user's profile.
 * Only updates the fields provided in the request body.
 */
export async function updateMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Validate input
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const updatedUser = await updateProfile(req.user.userId, parsed.data);

    sendSuccess(res, {
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/users/me/password
 *
 * Change the current user's password.
 * Requires the current password for security.
 * Revokes all refresh tokens on success (logs out all devices).
 */
export async function changeMyPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Validate input
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    await changePassword(req.user.userId, parsed.data);

    sendSuccess(res, {
      message:
        'Password changed successfully. Please log in again on all devices.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/users/me
 *
 * Delete the current user's account.
 * Requires password confirmation.
 * Cascade-deletes all related data (cart, orders, reviews, etc.).
 */
export async function deleteMyAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // Validate input
    const parsed = deleteAccountSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    await deleteAccount(req.user.userId, parsed.data);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    sendSuccess(res, {
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}