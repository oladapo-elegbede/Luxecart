"use client";

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * React Query Provider.
 *
 * Wraps the app with QueryClient for server state management.
 *
 * KEY CONFIG:
 *   staleTime: 60s          — Data is considered fresh for 1 minute
 *   gcTime: 5 minutes       — Unused data garbage-collected after 5 min
 *   refetchOnWindowFocus    — Don't refetch when user tabs back (less aggressive)
 *   retry: 1                — Retry failed queries once (don't hammer the API)
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
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
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