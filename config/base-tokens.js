/**
 * Base Network Token Configuration
 * Popular tokens on Base blockchain with contract addresses and metadata
 */

export const BASE_TOKENS = {
  // ============================================
  // NATIVE & WRAPPED TOKENS
  // ============================================
  ETH: {
    address: 'native',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    coingeckoId: 'ethereum',
    logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    category: 'native',
  },
  
  WETH: {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    coingeckoId: 'weth',
    logo: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    category: 'wrapped',
  },

  // ============================================
  // STABLECOINS
  // ============================================
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    coingeckoId: 'usd-coin',
    logo: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    category: 'stablecoin',
  },
  
  USDT: {
    address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    coingeckoId: 'tether',
    logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    category: 'stablecoin',
  },
  
  DAI: {
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    coingeckoId: 'dai',
    logo: 'https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png',
    category: 'stablecoin',
  },

  // ============================================
  // COINBASE ECOSYSTEM
  // ============================================
  cbETH: {
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    decimals: 18,
    coingeckoId: 'coinbase-wrapped-staked-eth',
    logo: 'https://assets.coingecko.com/coins/images/27008/small/cbeth.png',
    category: 'liquid-staking',
  },

  // ============================================
  // MEME COINS (Base Culture)
  // ============================================
  BRETT: {
    address: '0x532f27101965dd16442e59d40670faf5ebb142e4',
    symbol: 'BRETT',
    name: 'Brett',
    decimals: 18,
    coingeckoId: 'based-brett',
    logo: 'https://assets.coingecko.com/coins/images/35629/small/brett.png',
    category: 'meme',
    trending: true,
  },
  
  DEGEN: {
    address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
    symbol: 'DEGEN',
    name: 'Degen',
    decimals: 18,
    coingeckoId: 'degen-base',
    logo: 'https://assets.coingecko.com/coins/images/34515/small/degen.png',
    category: 'meme',
    trending: true,
  },
  
  TOSHI: {
    address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4',
    symbol: 'TOSHI',
    name: 'Toshi',
    decimals: 18,
    coingeckoId: 'toshi',
    logo: 'https://assets.coingecko.com/coins/images/31429/small/toshi.png',
    category: 'meme',
  },
  
  NORMIE: {
    address: '0x7F12d13B34F5F4f0a9449c16Bcd42f0da47AF200',
    symbol: 'NORMIE',
    name: 'Normie',
    decimals: 9,
    coingeckoId: 'normie',
    logo: 'https://assets.coingecko.com/coins/images/37787/small/normie.png',
    category: 'meme',
  },

  // ============================================
  // DEFI TOKENS
  // ============================================
  AERO: {
    address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    symbol: 'AERO',
    name: 'Aerodrome Finance',
    decimals: 18,
    coingeckoId: 'aerodrome-finance',
    logo: 'https://assets.coingecko.com/coins/images/31745/small/aero.png',
    category: 'defi',
    trending: true,
  },
  
  SEAM: {
    address: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85',
    symbol: 'SEAM',
    name: 'Seamless',
    decimals: 18,
    coingeckoId: 'seamless-protocol',
    logo: 'https://assets.coingecko.com/coins/images/35149/small/seamless.png',
    category: 'defi',
  },

  // ============================================
  // CROSS-CHAIN TOKENS
  // ============================================
  WBTC: {
    address: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    coingeckoId: 'wrapped-bitcoin',
    logo: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    category: 'wrapped',
  },
};

// ============================================
// TOKEN CATEGORIES
// ============================================
export const TOKEN_CATEGORIES = {
  native: 'Native',
  wrapped: 'Wrapped Assets',
  stablecoin: 'Stablecoins',
  'liquid-staking': 'Liquid Staking',
  meme: 'Meme Coins',
  defi: 'DeFi',
  nft: 'NFT',
  gaming: 'Gaming',
};

// ============================================
// POPULAR TOKEN LISTS
// ============================================
export const POPULAR_TOKENS = [
  'ETH',
  'USDC',
  'BRETT',
  'DEGEN',
  'AERO',
  'cbETH',
];

export const TRENDING_TOKENS = Object.entries(BASE_TOKENS)
  .filter(([_, token]) => token.trending)
  .map(([key, _]) => key);

export const STABLECOINS = Object.entries(BASE_TOKENS)
  .filter(([_, token]) => token.category === 'stablecoin')
  .map(([key, _]) => key);

export const MEME_COINS = Object.entries(BASE_TOKENS)
  .filter(([_, token]) => token.category === 'meme')
  .map(([key, _]) => key);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get token by contract address
 */
export function getTokenByAddress(address) {
  return Object.values(BASE_TOKENS).find(
    token => token.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Get token by symbol
 */
export function getTokenBySymbol(symbol) {
  return BASE_TOKENS[symbol.toUpperCase()];
}

/**
 * Get tokens by category
 */
export function getTokensByCategory(category) {
  return Object.entries(BASE_TOKENS)
    .filter(([_, token]) => token.category === category)
    .reduce((acc, [key, token]) => ({ ...acc, [key]: token }), {});
}

/**
 * Get all token addresses
 */
export function getAllTokenAddresses() {
  return Object.values(BASE_TOKENS)
    .filter(token => token.address !== 'native')
    .map(token => token.address);
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount, symbol) {
  const token = getTokenBySymbol(symbol);
  if (!token) return amount;
  
  const divisor = Math.pow(10, token.decimals);
  return (Number(amount) / divisor).toFixed(6);
}

/**
 * Parse token amount to wei
 */
export function parseTokenAmount(amount, symbol) {
  const token = getTokenBySymbol(symbol);
  if (!token) return amount;
  
  const multiplier = Math.pow(10, token.decimals);
  return (Number(amount) * multiplier).toString();
}

export default BASE_TOKENS;

