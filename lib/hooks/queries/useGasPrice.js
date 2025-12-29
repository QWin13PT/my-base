/**
 * React Query hooks for gas price data
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { internalApiClient } from '@/lib/api/client';

/**
 * Query keys for gas prices
 */
export const gasPriceKeys = {
  all: ['gasPrice'],
  current: () => [...gasPriceKeys.all, 'current'],
  history: (hours) => [...gasPriceKeys.all, 'history', hours],
};

/**
 * Hook to fetch current gas price
 * @param {object} options - Query options
 * @returns {object} Query result with gas price data
 */
export function useGasPrice(options = {}) {
  const {
    enabled = true,
    refetchInterval = 15000, // 15 seconds
    staleTime = 15000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: gasPriceKeys.current(),
    queryFn: async () => {
      // This assumes you have a gas price API endpoint
      // You may need to implement this endpoint first
      return internalApiClient.get('/gas-price');
    },
    enabled,
    staleTime,
    refetchInterval,
    ...queryOptions,
  });
}

/**
 * Hook to fetch gas price history
 * @param {number} hours - Number of hours of history
 * @param {object} options - Query options
 * @returns {object} Query result with historical gas price data
 */
export function useGasPriceHistory(hours = 24, options = {}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: gasPriceKeys.history(hours),
    queryFn: async () => {
      return internalApiClient.get('/gas-price/history', { hours });
    },
    enabled,
    staleTime,
    ...queryOptions,
  });
}

