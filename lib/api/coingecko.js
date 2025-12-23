/**
 * CoinGecko API Service
 * Wrapper for CoinGecko API with rate limiting and caching
 */

import { API_CONFIG, buildApiUrl, getApiHeaders, CACHE_DURATIONS } from '@/config/api-endpoints';
import { cacheApiRequest, CacheStrategy } from '@/lib/utils/cache';
import { makeTrackedRequest } from '@/lib/utils/rate-limiter';
import { BASE_TOKENS } from '@/config/base-tokens';

const SERVICE = 'coingecko';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Make CoinGecko API request
 */
async function fetchFromCoinGecko(endpoint, params = {}) {
  const url = buildApiUrl(SERVICE, endpoint, params);
  
  console.log('🔗 CoinGecko Request:', url);
  
  const response = await fetch(url, {
    headers: getApiHeaders(SERVICE),
  });
  
  if (!response.ok) {
    console.error('❌ CoinGecko Error:', response.status, url);
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }
  
  console.log('✅ CoinGecko Success:', url);
  return response.json();
}

// ============================================
// TOKEN PRICES
// ============================================

/**
 * Get token price by contract address (via Next.js API route to avoid CORS)
 * @param {string} contractAddress - Token contract address
 * @param {string} vsCurrency - Currency to compare against (default: 'usd')
 */
export async function getTokenPrice(contractAddress, vsCurrency = 'usd') {
  const cacheKey = `price_${contractAddress}_${vsCurrency}`;
  
  return cacheApiRequest(
    SERVICE,
    cacheKey,
    { contract_addresses: contractAddress, vs_currencies: vsCurrency },
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        // Call our Next.js API route instead of CoinGecko directly
        const params = new URLSearchParams({
          contract_addresses: contractAddress,
          vs_currencies: vsCurrency,
          include_24hr_change: 'true',
          include_24hr_vol: 'true',
          include_market_cap: 'true',
        });
        
        const apiUrl = `/api/coingecko/token-price?${params.toString()}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Response format: { "0x...": { "usd": 1.5, "usd_24h_change": 2.5 } }
        const addressLower = contractAddress.toLowerCase();
        const tokenData = data[addressLower];
        
        if (!tokenData) {
          throw new Error('Token not found or not supported on CoinGecko');
        }
        
        return {
          price: tokenData[vsCurrency] || 0,
          priceChange24h: tokenData[`${vsCurrency}_24h_change`] || 0,
          marketCap: tokenData[`${vsCurrency}_market_cap`] || 0,
          volume24h: tokenData[`${vsCurrency}_24h_vol`] || 0,
        };
      });
    },
    { duration: CACHE_DURATIONS.prices }
  );
}

/**
 * Get multiple token prices in batch (via Next.js API route to avoid CORS)
 * @param {string[]} contractAddresses - Array of token contract addresses
 * @param {string} vsCurrency - Currency to compare against (default: 'usd')
 */
export async function getBatchTokenPrices(contractAddresses, vsCurrency = 'usd') {
  const cacheKey = `batch_prices_${contractAddresses.join(',')}_${vsCurrency}`;
  
  return cacheApiRequest(
    SERVICE,
    cacheKey,
    { addresses: contractAddresses.join(','), vs: vsCurrency },
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        // Call our Next.js API route instead of CoinGecko directly
        const params = new URLSearchParams({
          contract_addresses: contractAddresses.join(','),
          vs_currencies: vsCurrency,
          include_24hr_change: 'true',
          include_24hr_vol: 'true',
          include_market_cap: 'true',
        });
        
        const apiUrl = `/api/coingecko/token-price?${params.toString()}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Response format: { "0x...": { "usd": 1.5, "usd_24h_change": 2.5 }, "0x...": {...} }
        return data;
      });
    },
    { duration: CACHE_DURATIONS.prices }
  );
}

/**
 * Get prices for all popular Base tokens
 */
export async function getPopularTokenPrices(vsCurrency = 'usd') {
  const addresses = Object.values(BASE_TOKENS)
    .filter(token => token.address !== 'native')
    .map(token => token.address);
  
  return getBatchTokenPrices(addresses, vsCurrency);
}

// ============================================
// TOKEN DETAILS
// ============================================

/**
 * Get detailed token information
 * @param {string} coinId - CoinGecko coin ID
 */
export async function getTokenDetails(coinId) {
  const endpoint = API_CONFIG[SERVICE].endpoints.tokenDetails(coinId);
  
  return cacheApiRequest(
    SERVICE,
    endpoint,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        return fetchFromCoinGecko(endpoint, {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: true,
          developer_data: false,
        });
      });
    },
    { duration: CACHE_DURATIONS.tokenMetadata }
  );
}

// ============================================
// MARKET CHARTS
// ============================================

/**
 * Get historical market chart data
 * @param {string} coinId - CoinGecko coin ID
 * @param {number} days - Number of days (1, 7, 14, 30, 90, 180, 365, max)
 * @param {string} vsCurrency - Currency to compare against
 */
export async function getMarketChart(coinId, days = 7, vsCurrency = 'usd') {
  const endpoint = API_CONFIG[SERVICE].endpoints.marketChart(coinId);
  
  return cacheApiRequest(
    SERVICE,
    endpoint,
    { days, vs_currency: vsCurrency },
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromCoinGecko(endpoint, {
          vs_currency: vsCurrency,
          days,
          interval: days <= 1 ? 'hourly' : 'daily',
        });
        
        return {
          prices: data.prices || [],
          marketCaps: data.market_caps || [],
          volumes: data.total_volumes || [],
        };
      });
    },
    { duration: CACHE_DURATIONS.historicalData }
  );
}

// ============================================
// SEARCH & DISCOVERY
// ============================================

/**
 * Search for tokens
 * @param {string} query - Search query
 */
export async function searchTokens(query) {
  const endpoint = API_CONFIG[SERVICE].endpoints.search;
  
  return cacheApiRequest(
    SERVICE,
    endpoint,
    { query },
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromCoinGecko(endpoint, { query });
        
        return {
          coins: data.coins || [],
          exchanges: data.exchanges || [],
        };
      });
    },
    { duration: CACHE_DURATIONS.tokenMetadata }
  );
}

/**
 * Get historical market data for a token
 * @param {string} contractAddress - Token contract address
 * @param {string} vsCurrency - Currency to compare against (default: 'usd')
 * @param {number} days - Number of days of data (1, 7, 14, 30, 90, 180, 365, max)
 */
export async function getTokenMarketChart(contractAddress, vsCurrency = 'usd', days = 7) {
  if (!contractAddress) {
    throw new Error('Token address not available');
  }

  return cacheApiRequest(
    SERVICE,
    `market_chart_${contractAddress}_${days}`,
    { days },
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const apiUrl = `/api/coingecko/market-chart?contract_address=${contractAddress}&vs_currency=${vsCurrency}&days=${days}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the data into a more usable format
        return {
          prices: data.prices?.map(([timestamp, price]) => ({
            timestamp,
            date: new Date(timestamp),
            price,
          })) || [],
          ohlcv: data.ohlcv?.map((item) => ({
            timestamp: item.timestamp,
            date: new Date(item.timestamp),
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
          })) || [],
        };
      });
    },
    { duration: CACHE_DURATIONS.prices }
  );
}

/**
 * Get trending tokens
 */
export async function getTrendingTokens() {
  const endpoint = API_CONFIG[SERVICE].endpoints.trending;
  
  return cacheApiRequest(
    SERVICE,
    endpoint,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        return fetchFromCoinGecko(endpoint);
      });
    },
    { duration: CACHE_DURATIONS.prices }
  );
}

// ============================================
// TOKEN LIST
// ============================================

/**
 * Get all Base tokens list
 */
export async function getBaseTokensList() {
  const endpoint = API_CONFIG[SERVICE].endpoints.tokenList;
  
  return cacheApiRequest(
    SERVICE,
    'token_list_base',
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch token list: ${response.statusText}`);
        }
        
        return response.json();
      });
    },
    { 
      duration: CACHE_DURATIONS.tokenList,
      strategy: CacheStrategy.BOTH, // Store in both memory and localStorage
    }
  );
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Get price for a Base token by symbol
 */
export async function getBaseTokenPrice(symbol, vsCurrency = 'usd') {
  const token = BASE_TOKENS[symbol.toUpperCase()];
  if (!token) {
    throw new Error(`Unknown token symbol: ${symbol}`);
  }
  
  if (token.address === 'native') {
    // For native ETH, use the coingecko ID directly
    const data = await getTokenDetails('ethereum');
    return {
      symbol: token.symbol,
      name: token.name,
      price: data.market_data?.current_price?.[vsCurrency] || 0,
      priceChange24h: data.market_data?.price_change_percentage_24h || 0,
      marketCap: data.market_data?.market_cap?.[vsCurrency] || 0,
      volume24h: data.market_data?.total_volume?.[vsCurrency] || 0,
    };
  }
  
  return getTokenPrice(token.address, vsCurrency);
}

/**
 * Get prices for multiple Base tokens by symbol
 */
export async function getBaseTokensPrices(symbols, vsCurrency = 'usd') {
  const addresses = symbols.map(symbol => {
    const token = BASE_TOKENS[symbol.toUpperCase()];
    if (!token) throw new Error(`Unknown token symbol: ${symbol}`);
    return token.address;
  }).filter(addr => addr !== 'native');
  
  return getBatchTokenPrices(addresses, vsCurrency);
}

// Export all functions
export default {
  getTokenPrice,
  getBatchTokenPrices,
  getPopularTokenPrices,
  getTokenDetails,
  getMarketChart,
  searchTokens,
  getTrendingTokens,
  getBaseTokensList,
  getBaseTokenPrice,
  getBaseTokensPrices,
};

