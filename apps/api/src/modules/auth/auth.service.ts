import crypto from 'crypto';
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
  ValidationError,
} from '../../shared/errors/HttpError';
import { env } from '../../config/env';
import {
  sendEmail,
  buildVerificationEmail,
  buildPasswordResetEmail,
} from '../../config/email';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
} from './auth.validator';
import type { User } from '@prisma/client';

/**
 * Authentication Service.
 *
 * Business logic for:
 *   - Register / Login / Logout
 *   - Token refresh (with rotation)
 *   - Email verification
 *   - Password reset
 */

export interface AuthResult {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/**
 * Generate a cryptographically secure random token.
 *
 * Used for email verification and password reset URLs.
 * 32 bytes = 64 hex characters = effectively impossible to guess.
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Build a URL for the frontend.
 *
 * Example: buildClientUrl('/verify-email', { token: 'xyz' })
 *   → 'http://localhost:3000/verify-email?token=xyz'
 */
function buildClientUrl(path: string, params: Record<string, string>): string {
  const url = new URL(path, env.CLIENT_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

// ─────────────────────────────────────────
// Registration
// ─────────────────────────────────────────

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(input.password);

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

  // Send verification email (fire-and-forget — don't fail registration if email fails)
  sendVerificationEmail(user.id).catch((err) => {
    console.error('Failed to send verification email:', err);
  });

  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await storeRefreshToken(user.id, refreshToken);

  const { password: _password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

// ─────────────────────────────────────────
// Login
// ─────────────────────────────────────────

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const isPasswordValid = await verifyPassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (user.isSuspended) {
    throw new AuthenticationError(
      'This account has been suspended. Please contact support.'
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await storeRefreshToken(user.id, refreshToken);

  const { password: _password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

// ─────────────────────────────────────────
// Token Refresh (with rotation)
// ─────────────────────────────────────────

export async function refreshAccessToken(
  oldRefreshToken: string
): Promise<AuthResult> {
  const payload = verifyRefreshToken(oldRefreshToken);

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

  const newPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  await Promise.all([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    }),
    storeRefreshToken(storedToken.userId, newRefreshToken),
  ]);

  const { password: _password, ...userWithoutPassword } = storedToken.user;

  return {
    user: userWithoutPassword,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

// ─────────────────────────────────────────
// Logout
// ─────────────────────────────────────────

export async function logoutUser(refreshToken: string): Promise<void> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    return;
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });
}

// ─────────────────────────────────────────
// Get Current User
// ─────────────────────────────────────────

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

// ─────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────

/**
 * Send (or re-send) a verification email to a user.
 *
 * Flow:
 *   1. Delete any existing UNUSED verification tokens
 *   2. Generate a new secure token
 *   3. Store it (hashed) with 24-hour expiry
 *   4. Send the email with the verification link
 *
 * IMPORTANT: We store the RAW token, not a hash.
 * The token is sent only in the email and only used once.
 * Hashing it adds little security in this case.
 */
async function sendVerificationEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.isVerified) {
    return; // Already verified, no email needed
  }

  // Delete any pending verification tokens for this user
  await prisma.verificationToken.deleteMany({
    where: {
      userId,
      type: 'EMAIL_VERIFICATION',
      usedAt: null,
    },
  });

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);

  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
    },
  });

  const verificationUrl = buildClientUrl('/verify-email', { token });
  const email = buildVerificationEmail(user.email, user.firstName, verificationUrl);
  await sendEmail(email);
}

/**
 * Verify a user's email using the token from their email link.
 *
 * Flow:
 *   1. Find the token in DB
 *   2. Check it's not used or expired
 *   3. Mark user as verified
 *   4. Mark token as used
 */
export async function verifyEmail(input: VerifyEmailInput): Promise<void> {
  const storedToken = await prisma.verificationToken.findUnique({
    where: { token: input.token },
  });

  if (!storedToken || storedToken.type !== 'EMAIL_VERIFICATION') {
    throw new ValidationError('Invalid or expired verification link');
  }

  if (storedToken.usedAt) {
    throw new ValidationError('This verification link has already been used');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new ValidationError('This verification link has expired');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: storedToken.userId },
      data: { isVerified: true },
    }),
    prisma.verificationToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

/**
 * Resend a verification email.
 *
 * SECURITY: We always return success, even if the email doesn't exist.
 * This prevents email enumeration attacks.
 */
export async function resendVerification(
  input: ResendVerificationInput
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // Silently succeed if user doesn't exist or already verified
  if (!user || user.isVerified) {
    return;
  }

  await sendVerificationEmail(user.id);
}

// ─────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────

/**
 * Request a password reset email.
 *
 * SECURITY: Always return success regardless of whether the email exists.
 * This prevents email enumeration attacks.
 */
export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // Silently succeed if user doesn't exist
  if (!user) {
    return;
  }

  // Delete any existing unused reset tokens
  await prisma.verificationToken.deleteMany({
    where: {
      userId: user.id,
      type: 'PASSWORD_RESET',
      usedAt: null,
    },
  });

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      type: 'PASSWORD_RESET',
      expiresAt,
    },
  });

  const resetUrl = buildClientUrl('/reset-password', { token });
  const email = buildPasswordResetEmail(user.email, user.firstName, resetUrl);
  await sendEmail(email);
}

/**
 * Reset a user's password using the token from their email.
 *
 * Flow:
 *   1. Find and validate the token
 *   2. Hash the new password
 *   3. Update user
 *   4. Mark token as used
 *   5. Revoke ALL existing refresh tokens (force logout everywhere)
 */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const storedToken = await prisma.verificationToken.findUnique({
    where: { token: input.token },
  });

  if (!storedToken || storedToken.type !== 'PASSWORD_RESET') {
    throw new ValidationError('Invalid or expired reset link');
  }

  if (storedToken.usedAt) {
    throw new ValidationError('This reset link has already been used');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new ValidationError('This reset link has expired');
  }

  const newPasswordHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: storedToken.userId },
      data: { password: newPasswordHash },
    }),
    prisma.verificationToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() },
    }),
    // Revoke all refresh tokens — security best practice on password change
    prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId, revoked: false },
      data: { revoked: true },
    }),
  ]);
}

// ─────────────────────────────────────────
// Internal: Store Refresh Token
// ─────────────────────────────────────────

async function storeRefreshToken(
  userId: string,
  token: string
): Promise<void> {
  const expiresAt = calculateRefreshExpiry();

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

function calculateRefreshExpiry(): Date {
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN;
  const now = Date.now();
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
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