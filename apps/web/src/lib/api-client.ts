import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Centralized Axios API client.
 *
 * Features:
 *   1. Base URL from environment variable
 *   2. Auto-attaches access token from localStorage to every request
 *   3. Auto-refreshes access token on 401 errors
 *   4. Sends cookies (for httpOnly refresh token)
 *   5. Standardized error parsing
 *
 * USAGE:
 *   import { api } from '@/lib/api-client';
 *   const response = await api.get('/products');
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// Storage keys for access token
const ACCESS_TOKEN_KEY = 'luxecart_access_token';

/**
 * Helpers to manage the access token in localStorage.
 *
 * SAFE FROM SSR ISSUES: All access to `localStorage` is guarded
 * with `typeof window` checks.
 */
export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

/**
 * Create the configured Axios instance.
 *
 * withCredentials: true — Sends cookies cross-origin
 *   (required for our httpOnly refresh token cookie)
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor.
 *
 * Runs BEFORE every request.
 * Attaches the access token to the Authorization header.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor.
 *
 * Runs AFTER every response.
 * On 401 (token expired), tries to refresh once.
 *
 * The refresh logic:
 *   1. Get a new access token using the refresh cookie
 *   2. Save the new token
 *   3. Retry the original failed request with the new token
 *
 * If refresh fails, clear token and redirect to login.
 */

// Track if we're currently refreshing to avoid infinite loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't retry if:
    // - No original request
    // - Already retried once
    // - Not a 401 error
    // - The 401 is from the refresh endpoint itself
    if (
      !originalRequest ||
      originalRequest._retry ||
      error.response?.status !== 401 ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token as string}`;
          }
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Try to refresh the access token
      const response = await api.post('/auth/refresh');
      const newToken = response.data?.data?.accessToken;

      if (!newToken) {
        throw new Error('No access token in refresh response');
      }

      tokenStorage.set(newToken);
      processQueue(null, newToken);

      // Retry the original request
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed — clear token and redirect to login
      processQueue(refreshError, null);
      tokenStorage.clear();

      if (typeof window !== 'undefined') {
        // Only redirect if we're not already on a public page
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
          window.location.href = '/login';
        }
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Extract a human-readable error message from any error.
 *
 * Used by React Query error handlers and try/catch blocks.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      'An unexpected error occurred'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}