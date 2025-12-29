/**
 * React Query Provider
 * Configures and provides React Query client to the application
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, Suspense, lazy } from 'react';

// Lazy load DevTools only in development
const ReactQueryDevtools = 
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((mod) => ({
          default: mod.ReactQueryDevtools,
        }))
      )
    : null;

/**
 * Default query client configuration
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time: 30 seconds
        staleTime: 30 * 1000,
        // Cache time: 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch configuration
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        // Network mode
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations once by default
        retry: 1,
        retryDelay: 1000,
        networkMode: 'online',
      },
    },
  });
}

let browserQueryClient = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

/**
 * Query Provider Component
 * Wraps the application with React Query provider
 */
export function QueryProvider({ children }) {
  // Don't re-create query client on every render
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development (lazy loaded) */}
      {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools 
            initialIsOpen={false} 
            position="bottom-right"
            buttonPosition="bottom-right"
          />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

/**
 * Export query client for use in server components
 */
export { getQueryClient };

