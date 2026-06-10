import { prisma } from '../../config/database';
import { hashPassword, verifyPassword } from '../../shared/helpers/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type TokenPayload,
} from '../../shared/helpers/token';
import {
  ConflictError,
  AuthenticationError,
  NotFoundError,
} from '../../shared/errors/HttpError';
import { env } from '../../config/env';
import type { RegisterInput, LoginInput } from './auth.validator';
import type { User } from '@prisma/client';

/**
 * Authentication Service.
 *
 * Contains all authentication business logic.
 * Knows nothing about HTTP requests, responses, or cookies.
 *
 * The controller wraps this service with HTTP concerns.
 * Tests can call this service directly without HTTP overhead.
 */

/**
 * Data we return to the client after auth (register/login).
 * Strips sensitive fields like password.
 */
export interface AuthResult {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user.
 *
 * Flow:
 * 1. Check email isn't already taken
 * 2. Hash the password
 * 3. Create user in database (with cart and wishlist)
 * 4. Generate access + refresh tokens
 * 5. Store refresh token in database
 * 6. Return user data + tokens
 *
 * @throws ConflictError if email already exists
 */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  // 1. Check if email is taken
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  // 2. Hash the password
  const hashedPassword = await hashPassword(input.password);

  // 3. Create user with their cart and wishlist
  //    Using a transaction ensures all-or-nothing creation
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });

  // 4. Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // 5. Store refresh token in database (for revocation on logout)
  await storeRefreshToken(user.id, refreshToken);

  // 6. Return user (without password) + tokens
  const { password: _password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

/**
 * Log in an existing user.
 *
 * Flow:
 * 1. Find user by email
 * 2. Verify password against stored hash
 * 3. Check account isn't suspended
 * 4. Update last login timestamp
 * 5. Generate new tokens
 * 6. Store refresh token
 *
 * @throws AuthenticationError if credentials are invalid
 *
 * SECURITY NOTE:
 * We use the SAME error message for "email not found" and "wrong password".
 * This prevents attackers from enumerating which emails exist in our system.
 */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // 2. Verify password
  const isPasswordValid = await verifyPassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // 3. Check suspension
  if (user.isSuspended) {
    throw new AuthenticationError(
      'This account has been suspended. Please contact support.'
    );
  }

  // 4. Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 5. Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // 6. Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  // 7. Return user (without password) + tokens
  const { password: _password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh an access token using a valid refresh token.
 *
 * Flow:
 * 1. Verify the refresh token's JWT signature
 * 2. Check the token exists in DB and isn't revoked
 * 3. Generate a NEW access token AND a NEW refresh token (rotation)
 * 4. Revoke the old refresh token
 * 5. Store the new refresh token
 *
 * REFRESH TOKEN ROTATION:
 * Every refresh issues a NEW refresh token and invalidates the old one.
 * This limits the damage if a refresh token is stolen — it only works once.
 */
export async function refreshAccessToken(
  oldRefreshToken: string
): Promise<AuthResult> {
  // 1. Verify JWT signature
  const payload = verifyRefreshToken(oldRefreshToken);

  // 2. Check token exists in DB and isn't revoked
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AuthenticationError('Refresh token not found');
  }

  if (storedToken.revoked) {
    throw new AuthenticationError('Refresh token has been revoked');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AuthenticationError('Refresh token has expired');
  }

  // 3. Generate new tokens
  const newPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  // 4. Revoke old token + store new token (in parallel for speed)
  await Promise.all([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    }),
    storeRefreshToken(storedToken.userId, newRefreshToken),
  ]);

  // 5. Return user + new tokens
  const { password: _password, ...userWithoutPassword } = storedToken.user;

  return {
    user: userWithoutPassword,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Log out a user by revoking their refresh token.
 *
 * Note: We can't truly "invalidate" the access token (it's stateless JWT).
 * Instead, we revoke the refresh token so the user can't get a new access
 * token. The current access token still works until it expires (max 15min).
 *
 * For higher security needs, we could add a token blocklist in Redis.
 * We're not doing that to keep the architecture simple.
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    // Already gone — silent success
    return;
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });
}

/**
 * Get the current logged-in user.
 *
 * Called by the /me endpoint after auth middleware verifies the token.
 * Always returns FRESH data from database (not the JWT payload).
 *
 * @throws NotFoundError if user doesn't exist (e.g., deleted while logged in)
 */
export async function getCurrentUser(userId: string): Promise<Omit<User, 'password'>> {
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
 * Internal helper: Store a refresh token in the database.
 *
 * Calculates the expiry date based on JWT_REFRESH_EXPIRES_IN config.
 * Storing in DB allows us to revoke tokens (true logout).
 */
async function storeRefreshToken(
  userId: string,
  token: string
): Promise<void> {
  // Parse expiry like "7d" into a Date
  const expiresAt = calculateRefreshExpiry();

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

/**
 * Calculate refresh token expiry date based on env config.
 *
 * Supports formats: "7d", "24h", "60m", "3600s"
 * Defaults to 7 days if parsing fails.
 */
function calculateRefreshExpiry(): Date {
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN;
  const now = Date.now();
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
    // Fallback: 7 days
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1] ?? '7', 10);
  const unit = match[2] ?? 'd';

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(now + value * (multipliers[unit] ?? multipliers['d']!));
}