import { api } from '@/lib/api-client';
import type { ApiSuccessResponse, AuthResponse, User } from '@/types';

/**
 * Auth API Helpers.
 *
 * Thin typed wrappers around our backend /auth endpoints.
 * Used by React Query mutations and queries.
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

/**
 * Register a new user account.
 *
 * Returns user + access token.
 * Refresh token is set as httpOnly cookie automatically by backend.
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
 *
 * Returns user + access token.
 * Refresh token is set as httpOnly cookie automatically by backend.
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
 *
 * Backend revokes the refresh token and clears the cookie.
 * Frontend should clear local auth state after this resolves.
 */
export async function logoutUser(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * Get the currently authenticated user.
 *
 * Calls /auth/me with the access token.
 * Used on app load to restore session.
 */
export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiSuccessResponse<{ user: User }>>('/auth/me');
  return data.data.user;
}