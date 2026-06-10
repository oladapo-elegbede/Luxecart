import { prisma } from '../../config/database';
import { hashPassword, verifyPassword } from '../../shared/helpers/hash';
import {
  NotFoundError,
  AuthenticationError,
  ValidationError,
} from '../../shared/errors/HttpError';
import type {
  UpdateProfileInput,
  ChangePasswordInput,
  DeleteAccountInput,
} from './users.validator';
import type { User } from '@prisma/client';

/**
 * Users Service.
 *
 * Business logic for user profile management.
 * All functions assume the user is authenticated (auth middleware verified).
 */

/**
 * Get user profile by ID.
 *
 * Returns full user data WITHOUT the password hash.
 * Used by GET /users/me endpoint.
 */
export async function getUserById(
  userId: string
): Promise<Omit<User, 'password'>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  const { password: _password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Update user profile.
 *
 * Only updates provided fields (partial update).
 * The validator already ensured at least one field is present.
 *
 * Handles the case where phone or avatarUrl is sent as empty string
 * (user wants to clear the field) — converts "" to null in database.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<Omit<User, 'password'>> {
  // Build update data, converting empty strings to null
  const updateData: Record<string, string | null> = {};

  if (input.firstName !== undefined) {
    updateData['firstName'] = input.firstName;
  }
  if (input.lastName !== undefined) {
    updateData['lastName'] = input.lastName;
  }
  if (input.phone !== undefined) {
    updateData['phone'] = input.phone === '' ? null : input.phone;
  }
  if (input.avatarUrl !== undefined) {
    updateData['avatarUrl'] = input.avatarUrl === '' ? null : input.avatarUrl;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password: _password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    // Prisma throws P2025 when the record to update doesn't exist
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      throw new NotFoundError('User');
    }
    throw error;
  }
}

/**
 * Change user password.
 *
 * Security flow:
 * 1. Verify the user knows their CURRENT password
 *    (prevents stolen-token attackers from locking users out)
 * 2. Hash the new password
 * 3. Update the database
 * 4. Revoke ALL refresh tokens (forces re-login on all devices)
 *
 * This last step is critical — if attacker had a stolen refresh token,
 * password change invalidates it.
 */
export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<void> {
  // 1. Fetch user to get current password hash
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // 2. Verify current password
  const isCurrentPasswordValid = await verifyPassword(
    input.currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // 3. Hash the new password
  const newPasswordHash = await hashPassword(input.newPassword);

  // 4. Update password AND revoke all refresh tokens (in parallel)
  await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    }),
  ]);
}

/**
 * Delete user account.
 *
 * Security flow:
 * 1. Verify password (account deletion is irreversible)
 * 2. Delete user (Prisma cascade removes related records:
 *    - cart, wishlist, orders, reviews, addresses, etc.)
 *
 * NOTE: Order history will cascade-delete TOO.
 * In a real production system, you might want to anonymize the user
 * instead of fully deleting (for legal/financial record purposes).
 * For our portfolio, full deletion is acceptable.
 */
export async function deleteAccount(
  userId: string,
  input: DeleteAccountInput
): Promise<void> {
  // 1. Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // 2. Verify password
  const isPasswordValid = await verifyPassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new AuthenticationError('Password is incorrect');
  }

  // 3. Prevent admin from accidentally deleting themselves
  //    (in real production, you'd require transferring admin to another user first)
  if (user.role === 'ADMIN') {
    throw new ValidationError(
      'Admin accounts cannot be deleted via this endpoint. Contact support.'
    );
  }

  // 4. Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id: userId },
  });
}