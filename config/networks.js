/**
 * Network Configuration
 * Defines all supported blockchain networks and their properties
 * 
 * To switch networks, update NEXT_PUBLIC_NETWORK environment variable
 */

export const networks = {
  base: {
    id: 8453,
    name: 'base',
    displayName: 'Base',
    nativeCurrency: { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      decimals: 18 
    },
    rpcUrls: {
      default: { http: ['https://mainnet.base.org'] },
      public: { http: ['https://mainnet.base.org'] },
    },
    blockExplorers: {
      default: { 
        name: 'BaseScan', 
        url: 'https://basescan.org' 
      },
    },
    // Custom app branding per network
    branding: {
      logo: '/logos/base.svg',
      primaryColor: '#0052FF',    // Base blue
      accentColor: '#00D1FF',     // Bright cyan
      darkColor: '#0F172A',       // Deep slate
      lightColor: '#F8FAFC',      // Soft gray
    },
    // Network-specific API endpoints
    apis: {
      // CoinGecko platform ID for Base network tokens
      coingeckoId: 'base',
      // Base-specific data sources (to be researched/implemented)
      dexScreener: 'https://api.dexscreener.com/latest/dex/search',
      // Additional APIs can be added here
    },
  },
  
  // Future network support - Optimism
  optimism: {
    id: 10,
    name: 'optimism',
    displayName: 'Optimism',
    nativeCurrency: { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      decimals: 18 
    },
    rpcUrls: {
      default: { http: ['https://mainnet.optimism.io'] },
      public: { http: ['https://mainnet.optimism.io'] },
    },
    blockExplorers: {
      default: { 
        name: 'Optimistic Etherscan', 
        url: 'https://optimistic.etherscan.io' 
      },
    },
    branding: {
      logo: '/logos/optimism.svg',
      primaryColor: '#FF0420',
      accentColor: '#FFC0CB',
      darkColor: '#0F172A',
      lightColor: '#F8FAFC',
    },
    apis: {
      coingeckoId: 'optimistic-ethereum',
      dexScreener: 'https://api.dexscreener.com/latest/dex/search',
    },
  },

  // Future network support - Arbitrum
  arbitrum: {
    id: 42161,
    name: 'arbitrum',
    displayName: 'Arbitrum',
    nativeCurrency: { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      decimals: 18 
    },
    rpcUrls: {
      default: { http: ['https://arb1.arbitrum.io/rpc'] },
      public: { http: ['https://arb1.arbitrum.io/rpc'] },
    },
    blockExplorers: {
      default: { 
        name: 'Arbiscan', 
        url: 'https://arbiscan.io' 
      },
    },
    branding: {
      logo: '/logos/arbitrum.svg',
      primaryColor: '#28A0F0',
      accentColor: '#96BEDC',
      darkColor: '#0F172A',
      lightColor: '#F8FAFC',
    },
    apis: {
      coingeckoId: 'arbitrum-one',
      dexScreener: 'https://api.dexscreener.com/latest/dex/search',
    },
  },
};

/**
 * Get active network based on environment variable
 * Defaults to 'base' if not specified
 */
export const getActiveNetwork = () => {
  const networkName = process.env.NEXT_PUBLIC_NETWORK || 'base';
  return networks[networkName] || networks.base;
};

/**
 * Active network instance (singleton)
 * Use this throughout the app for network-specific configuration
 */
export const activeNetwork = getActiveNetwork();

/**
 * Get all available networks
 */
export const getAllNetworks = () => Object.values(networks);

/**
 * Check if a network is supported
 */
export const isNetworkSupported = (networkId) => {
  return Object.values(networks).some(network => network.id === networkId);
};

