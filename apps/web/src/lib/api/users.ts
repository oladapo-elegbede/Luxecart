import { api } from '@/lib/api-client';
import type { ApiSuccessResponse, User } from '@/types';

/**
 * Users API Helpers.
 *
 * All endpoints require authentication.
 * Manages the current user's profile and account.
 */

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountInput {
  password: string;
}

export async function getMyProfile(): Promise<User> {
  const { data } = await api.get<ApiSuccessResponse<{ user: User }>>(
    '/users/me'
  );
  return data.data.user;
}

export async function updateMyProfile(
  input: UpdateProfileInput
): Promise<User> {
  const { data } = await api.patch<ApiSuccessResponse<{ user: User }>>(
    '/users/me',
    input
  );
  return data.data.user;
}

export async function changeMyPassword(
  input: ChangePasswordInput
): Promise<void> {
  await api.patch('/users/me/password', input);
}

export async function deleteMyAccount(
  input: DeleteAccountInput
): Promise<void> {
  await api.delete('/users/me', { data: input });
}