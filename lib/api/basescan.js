/**
 * Basescan API Service
 * Wrapper for Basescan API with rate limiting and caching
 * Focus: Gas prices, Account data, Transactions
 */

import { API_CONFIG, API_KEYS, CACHE_DURATIONS } from '@/config/api-endpoints';
import { cacheApiRequest } from '@/lib/utils/cache';
import { makeTrackedRequest } from '@/lib/utils/rate-limiter';

const SERVICE = 'basescan';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Make Basescan API request
 */
async function fetchFromBasescan(params = {}) {
  const baseUrl = API_CONFIG[SERVICE].baseUrl;
  
  // Add API key if available
  const queryParams = {
    ...params,
    apikey: API_KEYS.basescan || '',
  };
  
  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${baseUrl}?${queryString}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Basescan API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status === '0' && data.message !== 'No transactions found') {
    throw new Error(`Basescan API error: ${data.message}`);
  }
  
  return data;
}

// ============================================
// GAS PRICES
// ============================================

/**
 * Get current gas prices
 */
export async function getGasPrices() {
  return cacheApiRequest(
    SERVICE,
    'gas_prices',
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromBasescan({
          module: 'gastracker',
          action: 'gasoracle',
        });
        
        return {
          safeGasPrice: data.result.SafeGasPrice,
          proposeGasPrice: data.result.ProposeGasPrice,
          fastGasPrice: data.result.FastGasPrice,
          suggestBaseFee: data.result.suggestBaseFee,
          gasUsedRatio: data.result.gasUsedRatio,
          lastBlock: data.result.LastBlock,
        };
      });
    },
    { duration: 30 * 1000 } // Cache for 30 seconds
  );
}

// ============================================
// ACCOUNT DATA
// ============================================

/**
 * Get ETH balance for an address
 * @param {string} address - Ethereum address
 */
export async function getAccountBalance(address) {
  return cacheApiRequest(
    SERVICE,
    `balance_${address}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromBasescan({
          module: 'account',
          action: 'balance',
          address,
          tag: 'latest',
        });
        
        return {
          address,
          balance: data.result,
          balanceEth: (parseInt(data.result) / 1e18).toFixed(6),
        };
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

/**
 * Get token balance for an address
 * @param {string} address - Ethereum address
 * @param {string} contractAddress - Token contract address
 */
export async function getTokenBalance(address, contractAddress) {
  return cacheApiRequest(
    SERVICE,
    `token_balance_${address}_${contractAddress}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromBasescan({
          module: 'account',
          action: 'tokenbalance',
          contractaddress: contractAddress,
          address,
          tag: 'latest',
        });
        
        return {
          address,
          contractAddress,
          balance: data.result,
        };
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

/**
 * Get multiple token balances for an address
 * @param {string} address - Ethereum address
 * @param {string[]} contractAddresses - Array of token contract addresses
 */
export async function getMultipleTokenBalances(address, contractAddresses) {
  const balances = await Promise.all(
    contractAddresses.map(contractAddress => 
      getTokenBalance(address, contractAddress)
    )
  );
  
  return balances;
}

// ============================================
// TRANSACTIONS
// ============================================

/**
 * Get transactions for an address
 * @param {string} address - Ethereum address
 * @param {number} page - Page number (default: 1)
 * @param {number} offset - Number of transactions per page (default: 10, max: 10000)
 */
export async function getTransactions(address, page = 1, offset = 10) {
  return cacheApiRequest(
    SERVICE,
    `transactions_${address}_${page}_${offset}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromBasescan({
          module: 'account',
          action: 'txlist',
          address,
          startblock: 0,
          endblock: 99999999,
          page,
          offset,
          sort: 'desc',
        });
        
        return {
          address,
          transactions: data.result || [],
        };
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

/**
 * Get internal transactions for an address
 * @param {string} address - Ethereum address
 * @param {number} page - Page number
 * @param {number} offset - Number of transactions per page
 */
export async function getInternalTransactions(address, page = 1, offset = 10) {
  return cacheApiRequest(
    SERVICE,
    `internal_tx_${address}_${page}_${offset}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromBasescan({
          module: 'account',
          action: 'txlistinternal',
          address,
          startblock: 0,
          endblock: 99999999,
          page,
          offset,
          sort: 'desc',
        });
        
        return {
          address,
          transactions: data.result || [],
        };
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

// ============================================
// CONTRACT DATA
// ============================================

/**
 * Get contract ABI
 * @param {string} address - Contract address
 */
export async function getContractABI(address) {
  return cacheApiRequest(
    SERVICE,
    `abi_${address}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromBasescan({
          module: 'contract',
          action: 'getabi',
          address,
        });
        
        return {
          address,
          abi: data.result,
        };
      });
    },
    { duration: CACHE_DURATIONS.tokenMetadata }
  );
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Get comprehensive wallet data
 * @param {string} address - Ethereum address
 */
export async function getWalletData(address) {
  return cacheApiRequest(
    SERVICE,
    `wallet_data_${address}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const [balance, transactions] = await Promise.all([
          getAccountBalance(address),
          getTransactions(address, 1, 20),
        ]);
        
        return {
          address,
          ethBalance: balance.balanceEth,
          recentTransactions: transactions.transactions,
        };
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

// Export all functions
export default {
  getGasPrices,
  getAccountBalance,
  getTokenBalance,
  getMultipleTokenBalances,
  getTransactions,
  getInternalTransactions,
  getContractABI,
  getWalletData,
};

