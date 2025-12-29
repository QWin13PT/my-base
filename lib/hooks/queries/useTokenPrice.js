/**
 * React Query hooks for token price data
 * Provides hooks for fetching and caching token prices using React Query
 */

'use client';

import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTokenPrice, getBatchTokenPrices, getTokenMarketChart } from '@/lib/api/coingecko';

/**
 * Query keys for token price queries
 * Centralized to ensure consistency and enable easy invalidation
 */
export const tokenPriceKeys = {
  all: ['tokenPrices'],
  price: (address) => [...tokenPriceKeys.all, 'price', address],
  batch: (addresses) => [...tokenPriceKeys.all, 'batch', addresses.sort().join(',')],
  chart: (address, days) => [...tokenPriceKeys.all, 'chart', address, days],
};

/**
 * Hook to fetch a single token price
 * @param {string} contractAddress - Token contract address
 * @param {object} options - Query options
 * @returns {object} Query result with price data
 */
export function useTokenPrice(contractAddress, options = {}) {
  const {
    enabled = true,
    refetchInterval = 30000, // 30 seconds
    staleTime = 30000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: tokenPriceKeys.price(contractAddress),
    queryFn: async () => {
      if (!contractAddress) {
        throw new Error('Contract address is required');
      }
      
      const result = await getTokenPrice(contractAddress);
      // Extract data from cache wrapper if present
      return result.data || result;
    },
    enabled: enabled && !!contractAddress,
    staleTime,
    refetchInterval,
    ...queryOptions,
  });
}

/**
 * Hook to fetch multiple token prices in batch
 * @param {string[]} contractAddresses - Array of token contract addresses
 * @param {object} options - Query options
 * @returns {object} Query result with batch price data
 */
export function useBatchTokenPrices(contractAddresses = [], options = {}) {
  const {
    enabled = true,
    refetchInterval = 30000,
    staleTime = 30000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: tokenPriceKeys.batch(contractAddresses),
    queryFn: async () => {
      if (!contractAddresses.length) {
        return {};
      }
      
      const result = await getBatchTokenPrices(contractAddresses);
      return result.data || result;
    },
    enabled: enabled && contractAddresses.length > 0,
    staleTime,
    refetchInterval,
    ...queryOptions,
  });
}

/**
 * Hook to fetch multiple individual token prices
 * Returns an array of query results, one for each token
 * @param {string[]} contractAddresses - Array of token contract addresses
 * @param {object} options - Query options
 * @returns {array} Array of query results
 */
export function useMultipleTokenPrices(contractAddresses = [], options = {}) {
  const {
    enabled = true,
    refetchInterval = 30000,
    staleTime = 30000,
    ...queryOptions
  } = options;

  return useQueries({
    queries: contractAddresses.map((address) => ({
      queryKey: tokenPriceKeys.price(address),
      queryFn: async () => {
        const result = await getTokenPrice(address);
        return result.data || result;
      },
      enabled: enabled && !!address,
      staleTime,
      refetchInterval,
      ...queryOptions,
    })),
  });
}

/**
 * Hook to fetch token market chart (historical prices)
 * @param {string} contractAddress - Token contract address
 * @param {number} days - Number of days of historical data
 * @param {object} options - Query options
 * @returns {object} Query result with chart data
 */
export function useTokenMarketChart(contractAddress, days = 7, options = {}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes for historical data
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: tokenPriceKeys.chart(contractAddress, days),
    queryFn: async () => {
      if (!contractAddress) {
        throw new Error('Contract address is required');
      }
      
      const result = await getTokenMarketChart(contractAddress, 'usd', days);
      return result.data || result;
    },
    enabled: enabled && !!contractAddress,
    staleTime,
    ...queryOptions,
  });
}

/**
 * Hook to prefetch token price
 * Useful for preloading data on hover or before navigation
 * @returns {function} Prefetch function
 */
export function usePrefetchTokenPrice() {
  const queryClient = useQueryClient();

  return async (contractAddress) => {
    await queryClient.prefetchQuery({
      queryKey: tokenPriceKeys.price(contractAddress),
      queryFn: async () => {
        const result = await getTokenPrice(contractAddress);
        return result.data || result;
      },
      staleTime: 30000,
    });
  };
}

/**
 * Hook to invalidate token price cache
 * Useful for force-refreshing prices
 * @returns {function} Invalidate function
 */
export function useInvalidateTokenPrices() {
  const queryClient = useQueryClient();

  return (contractAddress) => {
    if (contractAddress) {
      // Invalidate specific token
      return queryClient.invalidateQueries({
        queryKey: tokenPriceKeys.price(contractAddress),
      });
    } else {
      // Invalidate all token prices
      return queryClient.invalidateQueries({
        queryKey: tokenPriceKeys.all,
      });
    }
  };
}

/**
 * Mutation hook for updating cached price data
 * Useful for optimistic updates
 */
export function useUpdateTokenPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractAddress, priceData }) => {
      // This is for optimistic updates - the actual data comes from polling
      return { contractAddress, priceData };
    },
    onSuccess: ({ contractAddress, priceData }) => {
      queryClient.setQueryData(
        tokenPriceKeys.price(contractAddress),
        priceData
      );
    },
  });
}

/**
 * Hook to get cached token price without fetching
 * @param {string} contractAddress - Token contract address
 * @returns {object|undefined} Cached price data or undefined
 */
export function useCachedTokenPrice(contractAddress) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(tokenPriceKeys.price(contractAddress));
}

/**
 * Hook for auto-refreshing price with configurable interval
 * @param {string} contractAddress - Token contract address
 * @param {number} interval - Refresh interval in milliseconds
 * @param {object} options - Additional query options
 */
export function useAutoRefreshPrice(contractAddress, interval = 30000, options = {}) {
  return useTokenPrice(contractAddress, {
    ...options,
    refetchInterval: interval,
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not focused
  });
}

