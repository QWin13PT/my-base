/**
 * React Query hooks for trending tokens
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTrendingTokens } from '@/lib/api/coingecko';

/**
 * Query keys for trending tokens
 */
export const trendingTokensKeys = {
  all: ['trendingTokens'],
  list: () => [...trendingTokensKeys.all, 'list'],
};

/**
 * Hook to fetch trending tokens
 * @param {object} options - Query options
 * @returns {object} Query result with trending tokens data
 */
export function useTrendingTokens(options = {}) {
  const {
    enabled = true,
    refetchInterval = 5 * 60 * 1000, // 5 minutes
    staleTime = 5 * 60 * 1000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: trendingTokensKeys.list(),
    queryFn: async () => {
      const result = await getTrendingTokens();
      return result.data || result;
    },
    enabled,
    staleTime,
    refetchInterval,
    ...queryOptions,
  });
}

/**
 * Hook to prefetch trending tokens
 */
export function usePrefetchTrendingTokens() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: trendingTokensKeys.list(),
      queryFn: async () => {
        const result = await getTrendingTokens();
        return result.data || result;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

