import { z } from 'zod';

/**
 * Users Validators.
 *
 * Zod schemas for user profile operations.
 * All fields are OPTIONAL on update — users can change just one field
 * without sending the entire profile.
 */

/**
 * Update profile validator.
 *
 * All fields optional because users may only want to update one field.
 * Notice we DON'T allow updating email here (that needs re-verification).
 * Email change is a separate flow.
 *
 * IMPORTANT: We use .strict() so unknown fields are REJECTED.
 * This prevents attackers from sending { isAdmin: true } to escalate privileges.
 */
export const updateProfileSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(100, 'First name is too long')
      .trim()
      .optional(),

    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .max(100, 'Last name is too long')
      .trim()
      .optional(),

    phone: z
      .string()
      .min(7, 'Phone number is too short')
      .max(20, 'Phone number is too long')
      .regex(
        /^[+]?[\d\s()-]+$/,
        'Phone number can only contain digits, spaces, +, -, and parentheses'
      )
      .optional()
      .or(z.literal('')), // Allow empty string to clear the field

    avatarUrl: z
      .string()
      .url('Avatar URL must be a valid URL')
      .max(2000, 'Avatar URL is too long')
      .optional()
      .or(z.literal('')),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

/**
 * Change password validator.
 *
 * Requires the CURRENT password for security.
 * This prevents an attacker who steals an access token from changing
 * the password (which would lock the real user out).
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),

    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password is too long')
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'New password must contain at least one number'),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Delete account validator.
 *
 * Require password confirmation before account deletion.
 * Account deletion is destructive and irreversible — we need to be
 * sure the request is from the real user.
 */
export const deleteAccountSchema = z
  .object({
    password: z.string().min(1, 'Password is required to delete account'),
  })
  .strict();

/**
 * TypeScript types inferred from the schemas.
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;