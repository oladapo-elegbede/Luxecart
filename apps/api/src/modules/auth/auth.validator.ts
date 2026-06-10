import { z } from 'zod';

/**
 * Authentication Validators.
 *
 * Zod schemas that define the shape of valid input for each auth endpoint.
 * The schemas:
 * - Validate input at runtime (rejects invalid requests with clear errors)
 * - Generate TypeScript types automatically (no duplication)
 * - Provide field-level error messages for the frontend
 *
 * USAGE:
 *   const result = registerSchema.safeParse(req.body);
 *   if (!result.success) { return validation error }
 *   const validData = result.data; // fully typed
 */

/**
 * Registration validator.
 *
 * Password requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 *
 * These are common minimum requirements.
 * We don't require special characters because NIST guidelines now
 * recommend AGAINST forcing them (they encourage predictable patterns
 * like "Password1!" which are actually weaker).
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address')
    .toLowerCase()
    .max(255, 'Email is too long'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long')
    .trim(),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name is too long')
    .trim(),
});

/**
 * Login validator.
 *
 * Notice we DON'T enforce password rules here.
 * Login just checks if the password matches what's stored.
 * The rules above only apply at registration time.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address')
    .toLowerCase(),

  password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token validator.
 *
 * The refresh token comes from the httpOnly cookie, but we still
 * validate its presence to give a clear error if missing.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * TypeScript types inferred from the Zod schemas.
 *
 * Single source of truth: the Zod schema.
 * If we change the schema, the type updates automatically.
 * This prevents drift between validation and types.
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;