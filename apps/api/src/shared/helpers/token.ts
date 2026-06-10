import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthenticationError } from '../errors/HttpError';

/**
 * JWT Token Utilities.
 *
 * Centralized functions for creating and verifying JWT tokens.
 * Used by the auth module for login, registration, and refresh flows.
 */

/**
 * Payload stored inside our JWT tokens.
 *
 * We keep this MINIMAL because:
 * 1. Tokens are sent with every request — smaller is faster
 * 2. Tokens can be decoded by anyone — never put secrets here
 * 3. User data may change — fetch fresh data from DB instead
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

/**
 * Generate a short-lived access token.
 *
 * Used for: API authentication on every request
 * Lifetime: 15 minutes (configurable via JWT_ACCESS_EXPIRES_IN)
 * Storage: In-memory on client (Zustand store)
 */
export function generateAccessToken(payload: TokenPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = { expiresIn: env.JWT_ACCESS_EXPIRES_IN };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/**
 * Generate a long-lived refresh token.
 *
 * Used for: Getting a new access token when the current one expires
 * Lifetime: 7 days (configurable via JWT_REFRESH_EXPIRES_IN)
 * Storage: httpOnly cookie on client (XSS-proof)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = { expiresIn: env.JWT_REFRESH_EXPIRES_IN };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

/**
 * Verify an access token and return its payload.
 *
 * Throws AuthenticationError if:
 * - Token is missing
 * - Token signature is invalid (forged or tampered)
 * - Token has expired
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (typeof decoded !== 'object' || decoded === null) {
      throw new AuthenticationError('Invalid token format');
    }

    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify a refresh token and return its payload.
 *
 * Used only by the /auth/refresh endpoint.
 * Throws AuthenticationError on any verification failure.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

    if (typeof decoded !== 'object' || decoded === null) {
      throw new AuthenticationError('Invalid token format');
    }

    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw error;
  }
}