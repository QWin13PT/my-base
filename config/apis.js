/**
 * API Endpoints Configuration
 * Centralized configuration for all external APIs
 */

import { activeNetwork } from './networks';

/**
 * Third-party API endpoints
 */
export const externalApis = {
  // CoinGecko - Free tier for price data
  coingecko: {
    base: 'https://api.coingecko.com/api/v3',
    prices: '/simple/price',
    tokenInfo: '/coins',
  },
  
  // DeFi Llama - TVL and DeFi metrics
  defillama: {
    base: 'https://api.llama.fi',
    tvl: '/tvl',
    protocols: '/protocols',
  },
  
  // DexScreener - DEX trading data
  dexScreener: {
    base: 'https://api.dexscreener.com/latest/dex',
    search: '/search',
    pairs: '/pairs',
  },

  // Alchemy - Blockchain data (requires API key)
  alchemy: {
    base: process.env.NEXT_PUBLIC_ALCHEMY_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
  },
};

/**
 * Network-specific API endpoints
 * These pull from the active network configuration
 */
export const apiEndpoints = {
  // Network-specific endpoints
  network: {
    rpc: activeNetwork.rpcUrls.default.http[0],
    explorer: activeNetwork.blockExplorers.default.url,
  },
  
  // Price tracking
  priceTracker: externalApis.coingecko.base,
  
  // DEX data
  dexData: externalApis.dexScreener.base,
  
  // DeFi metrics
  defiMetrics: externalApis.defillama.base,
};

/**
 * Helper function to build API URLs
 * @param {string} service - The service name (e.g., 'priceTracker')
 * @param {string} path - The API path
 * @param {Object} params - Query parameters
 * @returns {string} Complete URL
 */
export const getApiUrl = (service, path = '', params = {}) => {
  const baseUrl = apiEndpoints[service];
  
  if (!baseUrl) {
    console.warn(`API service '${service}' not found`);
    return '';
  }
  
  const url = new URL(path, baseUrl);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

/**
 * API rate limits and caching configuration
 */
export const apiConfig = {
  // Default cache durations (in milliseconds)
  cacheDuration: {
    priceData: 30000,      // 30 seconds
    portfolioData: 60000,  // 1 minute
    networkStats: 120000,  // 2 minutes
    richList: 300000,      // 5 minutes
  },
  
  // Request timeouts
  timeout: {
    default: 10000,        // 10 seconds
    blockchain: 30000,     // 30 seconds for RPC calls
  },
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000,           // 1 second between retries
  },
};

/**
 * Helper to get CoinGecko token prices
 * @param {string[]} tokenIds - Array of token IDs
 * @returns {string} API URL
 */
export const getCoinGeckoPriceUrl = (tokenIds) => {
  return getApiUrl('priceTracker', '/simple/price', {
    ids: tokenIds.join(','),
    vs_currencies: 'usd',
    include_24hr_change: true,
    include_market_cap: true,
  });
};

/**
 * Helper to get DexScreener pair data
 * @param {string} chainId - Chain identifier
 * @param {string} pairAddress - Pair contract address
 * @returns {string} API URL
 */
export const getDexScreenerPairUrl = (chainId, pairAddress) => {
  return `${externalApis.dexScreener.base}/pairs/${chainId}/${pairAddress}`;
};

