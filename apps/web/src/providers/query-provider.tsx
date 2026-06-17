"use client";

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * React Query Provider.
 *
 * Wraps the app with QueryClient for server state management.
 *
 * KEY CONFIG (Optimized for production):
 *   staleTime: 5 min          — Data is considered fresh for 5 minutes
 *                               (drastically reduces backend API calls)
 *   gcTime: 30 minutes        — Unused data garbage-collected after 30 min
 *                               (faster page transitions, less re-fetching)
 *   refetchOnWindowFocus      — false (don't refetch on tab switch)
 *   refetchOnMount            — false (use cached data when available)
 *   refetchOnReconnect        — false (don't refetch on network reconnect)
 *   retry: 1                  — Retry failed queries once
 *
 * PERFORMANCE IMPACT:
 * For an e-commerce site where products/categories don't change every minute,
 * these settings drastically reduce backend load and improve perceived speed.
 * Users see cached data instantly, with background refresh as needed.
 *
 * WHY useState INSTEAD OF MODULE-LEVEL?
 * In Next.js App Router, a new QueryClient per request prevents data leakage
 * between users in SSR scenarios. useState ensures one client per browser tab.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes (was 1 min)
            gcTime: 30 * 60 * 1000, // 30 minutes (was 5 min)
            refetchOnWindowFocus: false,
            refetchOnMount: false, // NEW: use cached data on mount
            refetchOnReconnect: false, // NEW: don't refetch on reconnect
            retry: 1,
          },
          mutations: {
            retry: 0, // Never auto-retry mutations (could double-charge!)
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}