/**
 * API Services Index
 * Central export for all API wrapper functions
 */

// Import all services
import * as CoinGeckoAPI from './coingecko';
import * as DeFiLlamaAPI from './defillama';
import * as BasescanAPI from './basescan';
import * as MoralisAPI from './moralis';

// Re-export everything
export { CoinGeckoAPI, DeFiLlamaAPI, BasescanAPI, MoralisAPI };

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

export {
  // Moralis
  getWalletTokenBalances,
  getWalletNativeBalance,
  getWalletPortfolio,
  getTokenPrice as getMoralisTokenPrice,
  getTokenMetadata,
  getWalletTransactions,
  getWalletNFTs,
  formatTokenBalance,
  getWalletSummary,
} from './moralis';

// Default export
export default {
  CoinGecko: CoinGeckoAPI,
  DeFiLlama: DeFiLlamaAPI,
  Basescan: BasescanAPI,
  Moralis: MoralisAPI,
};

