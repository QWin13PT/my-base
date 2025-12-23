/**
 * API Services Index
 * Central export for all API wrapper functions
 */

// Import all services
import * as CoinGeckoAPI from './coingecko';
import * as DeFiLlamaAPI from './defillama';
import * as BasescanAPI from './basescan';

// Re-export everything
export { CoinGeckoAPI, DeFiLlamaAPI, BasescanAPI };

// Named exports for convenience
export {
  // CoinGecko
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
} from './coingecko';

export {
  // DeFiLlama
  getAllChains,
  getBaseChainData,
  getBaseTVL,
  getAllProtocols,
  getBaseProtocols,
  getProtocolDetails,
  getBaseNetworkStats,
  getTopBaseProtocols,
  getBaseProtocolsByCategory,
  getBaseTVLChange,
  compareL2Chains,
} from './defillama';

export {
  // Basescan
  getGasPrices,
  getAccountBalance,
  getTokenBalance,
  getMultipleTokenBalances,
  getTransactions,
  getInternalTransactions,
  getContractABI,
  getWalletData,
} from './basescan';

// Default export
export default {
  CoinGecko: CoinGeckoAPI,
  DeFiLlama: DeFiLlamaAPI,
  Basescan: BasescanAPI,
};

