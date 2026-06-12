"use client";

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { tokenStorage } from '@/lib/api-client';

/**
 * Auth Bootstrap Component.
 *
 * Runs once when the app mounts.
 * If there's a stored access token, calls /auth/me to validate it
 * and restore the user object to the auth store.
 *
 * If the token is invalid or missing, silently does nothing.
 * The store stays in its empty state and the user sees the logged-out UI.
 *
 * This component renders nothing — it's just side effects.
 */
export function AuthBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  // Only attempt if a token exists in storage
  const hasToken = typeof window !== 'undefined' && tokenStorage.get() !== null;

  const { data, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  React.useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  React.useEffect(() => {
    if (isError) {
      // Token is invalid — clear local state
      logout();
    }
  }, [isError, logout]);

  return null;
}