/**
 * API Configuration for MyBase Dashboard
 * Centralized configuration for all external API endpoints
 */

export const API_CONFIG = {
  // ============================================
  // COINGECKO API - Price Tracking & Token Data
  // ============================================
  coingecko: {
    name: 'CoinGecko',
    baseUrl: 'https://api.coingecko.com/api/v3',
    free: {
      limit: 10000, // 10k calls/month
      rateLimit: 50, // ~50 calls/minute (safe estimate)
    },
    endpoints: {
      // Get token price by contract address
      tokenPrice: (contractAddress) => 
        `/coins/base/contract/${contractAddress}`,
      
      // Get multiple token prices at once
      batchPrices: '/simple/token_price/base',
      
      // Get all Base tokens list
      tokenList: 'https://tokens.coingecko.com/base/all.json',
      
      // Search tokens
      search: '/search',
      
      // Market chart data (historical prices)
      marketChart: (coinId) => `/coins/${coinId}/market_chart`,
      
      // Get trending tokens
      trending: '/search/trending',
      
      // Get token details
      tokenDetails: (coinId) => `/coins/${coinId}`,
    },
  },

  // ============================================
  // DEFILLAMA API - TVL & Protocol Data
  // ============================================
  defiLlama: {
    name: 'DeFiLlama',
    baseUrl: 'https://api.llama.fi',
    free: {
      limit: Infinity, // Completely free
      rateLimit: 100, // No official limit, being conservative
    },
    endpoints: {
      // Get all chains TVL
      chains: '/v2/chains',
      
      // Get Base chain specific data
      baseChain: '/v2/chains/Base',
      
      // Get all protocols
      protocols: '/protocols',
      
      // Get Base protocols
      baseProtocols: '/protocols?chain=Base',
      
      // Get specific protocol
      protocol: (protocol) => `/protocol/${protocol}`,
      
      // Get current TVL
      currentTVL: '/tvl/base',
    },
  },

  // ============================================
  // MORALIS API - Wallet & Token Data
  // ============================================
  moralis: {
    name: 'Moralis',
    baseUrl: 'https://deep-index.moralis.io/api/v2.2',
    free: {
      limit: 40000, // 40k compute units/day
      rateLimit: 25, // 25 requests/second on free tier
    },
    requiresAuth: true,
    endpoints: {
      // Get wallet token balances
      walletTokens: (address) => `/${address}/erc20`,
      
      // Get token price
      tokenPrice: `/erc20/:address/price`,
      
      // Get wallet NFTs
      walletNFTs: (address) => `/${address}/nft`,
      
      // Get token metadata
      tokenMetadata: '/erc20/metadata',
      
      // Get wallet transactions
      walletTransactions: (address) => `/${address}`,
      
      // Get native balance
      nativeBalance: (address) => `/${address}/balance`,
    },
    chainId: '0x2105', // Base chain ID in hex (8453)
  },

  // ============================================
  // BITQUERY API - DEX Data & Analytics
  // ============================================
  bitquery: {
    name: 'Bitquery',
    baseUrl: 'https://graphql.bitquery.io',
    free: {
      limit: 10000, // 10k points
      rateLimit: 10, // 10 requests/minute
    },
    requiresAuth: true,
    graphql: true,
    endpoints: {
      graphql: '/graphql',
    },
  },

  // ============================================
  // DEXCHECK API - Whale Tracking & Rich Lists
  // ============================================
  dexCheck: {
    name: 'DexCheck',
    baseUrl: 'https://api.dexcheck.ai/v1',
    free: {
      limit: 1000, // Estimated, varies
      rateLimit: 5, // Conservative estimate
    },
    requiresAuth: true,
    endpoints: {
      // Top wallets (rich list)
      topWallets: '/wallets/top',
      
      // Whale transactions
      whaleTransactions: '/transactions/whale',
      
      // Token holders
      tokenHolders: (contractAddress) => `/token/${contractAddress}/holders`,
    },
  },

  // ============================================
  // BASESCAN API - Blockchain Explorer
  // ============================================
  basescan: {
    name: 'Basescan',
    baseUrl: 'https://api.basescan.org/api',
    free: {
      limit: 100000, // 100k calls/day
      rateLimit: 5, // 5 calls/second
    },
    requiresAuth: true,
    endpoints: {
      // Get account balance
      accountBalance: '?module=account&action=balance',
      
      // Get token balance
      tokenBalance: '?module=account&action=tokenbalance',
      
      // Get transactions
      transactions: '?module=account&action=txlist',
      
      // Get gas prices
      gasPrice: '?module=gastracker&action=gasoracle',
      
      // Get contract ABI
      contractABI: '?module=contract&action=getabi',
    },
  },

  // ============================================
  // BASE RPC - Direct Blockchain Access
  // ============================================
  baseRPC: {
    name: 'Base RPC',
    baseUrl: 'https://mainnet.base.org',
    free: {
      limit: 'Rate limited',
      rateLimit: 10, // Conservative
    },
    chainId: 8453,
  },

  // ============================================
  // ALCHEMY BASE - Enhanced RPC (Alternative)
  // ============================================
  alchemyBase: {
    name: 'Alchemy Base',
    baseUrl: 'https://base-mainnet.g.alchemy.com/v2',
    free: {
      limit: 300000000, // 300M compute units/month
      rateLimit: 330, // Requests per second
    },
    requiresAuth: true,
    chainId: 8453,
  },
};

// ============================================
// API KEYS CONFIGURATION
// ============================================
export const API_KEYS = {
  coingecko: process.env.NEXT_PUBLIC_COINGECKO_API_KEY || '', // Optional for free tier
  moralis: process.env.NEXT_PUBLIC_MORALIS_API_KEY || '',
  bitquery: process.env.NEXT_PUBLIC_BITQUERY_API_KEY || '',
  dexCheck: process.env.NEXT_PUBLIC_DEXCHECK_API_KEY || '',
  basescan: process.env.NEXT_PUBLIC_BASESCAN_API_KEY || '',
  alchemy: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '',
};

// ============================================
// CACHE DURATIONS (in milliseconds)
// ============================================
export const CACHE_DURATIONS = {
  // Price data - refresh frequently
  prices: 30 * 1000, // 30 seconds
  
  // Token metadata - rarely changes
  tokenMetadata: 24 * 60 * 60 * 1000, // 24 hours
  
  // Wallet balances - moderate refresh
  walletBalances: 5 * 60 * 1000, // 5 minutes
  
  // Network stats - moderate refresh
  networkStats: 2 * 60 * 1000, // 2 minutes
  
  // Rich lists - refresh less often
  richLists: 10 * 60 * 1000, // 10 minutes
  
  // Token list - rarely changes
  tokenList: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Historical data - cache longer
  historicalData: 60 * 60 * 1000, // 1 hour
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build full API URL with query parameters
 */
export function buildApiUrl(service, endpoint, params = {}) {
  const config = API_CONFIG[service];
  if (!config) throw new Error(`Unknown API service: ${service}`);
  
  const baseUrl = config.baseUrl;
  
  // Handle full URLs (like tokenList)
  let fullUrl;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    fullUrl = endpoint;
  } else {
    // Properly concatenate baseUrl and endpoint
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    fullUrl = cleanBase + cleanEndpoint;
  }
  
  const url = new URL(fullUrl);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
}

/**
 * Get API headers with authentication
 */
export function getApiHeaders(service) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add service-specific auth headers
  switch (service) {
    case 'moralis':
      if (API_KEYS.moralis) {
        headers['X-API-Key'] = API_KEYS.moralis;
      }
      break;
    case 'bitquery':
      if (API_KEYS.bitquery) {
        headers['X-API-KEY'] = API_KEYS.bitquery;
      }
      break;
    case 'dexCheck':
      if (API_KEYS.dexCheck) {
        headers['Authorization'] = `Bearer ${API_KEYS.dexCheck}`;
      }
      break;
    default:
      break;
  }
  
  return headers;
}

export default API_CONFIG;

