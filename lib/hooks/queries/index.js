/**
 * Centralized export for all React Query hooks
 */

// Token price queries
export {
  useTokenPrice,
  useBatchTokenPrices,
  useMultipleTokenPrices,
  useTokenMarketChart,
  usePrefetchTokenPrice,
  useInvalidateTokenPrices,
  useUpdateTokenPrice,
  useCachedTokenPrice,
  useAutoRefreshPrice,
  tokenPriceKeys,
} from './useTokenPrice';

// Trending tokens queries
export {
  useTrendingTokens,
  usePrefetchTrendingTokens,
  trendingTokensKeys,
} from './useTrendingTokens';

// Gas price queries
export {
  useGasPrice,
  useGasPriceHistory,
  gasPriceKeys,
} from './useGasPrice';

