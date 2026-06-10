import bcrypt from 'bcryptjs';
import { env } from '../../config/env';

/**
 * Password Hashing Utilities.
 *
 * Centralized password operations using bcrypt.
 * Used by the auth module for registration and login.
 *
 * WHY BCRYPT?
 * - Adaptive: configurable difficulty (salt rounds)
 * - Salt built-in (each hash is unique even for same password)
 * - Industry standard for password storage since 1999
 * - Slow by design (prevents brute force attacks)
 *
 * SALT ROUNDS = 12
 * - Each round doubles the computation time
 * - 12 rounds ≈ 250ms per hash (fast enough for UX, slow enough for security)
 * - Industry recommendation as of 2024
 */

/**
 * Hash a plain-text password.
 *
 * @param plainPassword - The password to hash (from user input)
 * @returns A bcrypt hash safe to store in the database
 *
 * @example
 * const hash = await hashPassword('MyPassword123!');
 * // hash = '$2a$12$xY3...' (60 characters)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = parseInt(env.BCRYPT_SALT_ROUNDS, 10);
  return bcrypt.hash(plainPassword, saltRounds);
}

/**
 * Verify a plain-text password against a stored hash.
 *
 * @param plainPassword - The password from user input
 * @param hashedPassword - The stored hash from the database
 * @returns true if password matches, false otherwise
 *
 * @example
 * const isValid = await verifyPassword('MyPassword123!', user.password);
 * if (!isValid) throw new AuthenticationError('Invalid credentials');
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}