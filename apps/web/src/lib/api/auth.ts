import { api } from '@/lib/api-client';
import type { ApiSuccessResponse, AuthResponse, User } from '@/types';

/**
 * Auth API Helpers.
 *
 * Thin typed wrappers around backend /auth endpoints.
 */

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface ResendVerificationInput {
  email: string;
}

/**
 * Register a new user account.
 */
export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccessResponse<AuthResponse>>(
    '/auth/register',
    input
  );
  return data.data;
}

/**
 * Log in an existing user.
 */
export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccessResponse<AuthResponse>>(
    '/auth/login',
    input
  );
  return data.data;
}

/**
 * Log out the current user.
 */
export async function logoutUser(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiSuccessResponse<{ user: User }>>('/auth/me');
  return data.data.user;
}

/**
 * Request a password reset email.
 *
 * Backend always returns success (security) — UI should show a neutral message.
 */
export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await api.post('/auth/forgot-password', input);
}

/**
 * Submit a new password using the reset token from email.
 */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await api.post('/auth/reset-password', input);
}

/**
 * Verify an email address using the token from email.
 */
export async function verifyEmail(input: VerifyEmailInput): Promise<void> {
  await api.post('/auth/verify-email', input);
}

/**
 * Request a new verification email.
 */
export async function resendVerification(
  input: ResendVerificationInput
): Promise<void> {
  await api.post('/auth/resend-verification', input);
}