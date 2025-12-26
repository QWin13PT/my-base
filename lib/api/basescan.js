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
  
  console.log('🔗 Basescan Request:', url.replace(/apikey=[^&]*/, 'apikey=***'));
  
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error('❌ Basescan HTTP Error:', response.status, response.statusText);
    throw new Error(`Basescan API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  console.log('📦 Basescan Response:', data);
  
  // Check for API-level errors
  if (data.status === '0') {
    // Special handling for common errors
    if (data.message === 'No transactions found') {
      return data; // This is not really an error
    }
    
    // Log detailed error information
    console.error('❌ Basescan API Error:', {
      status: data.status,
      message: data.message,
      result: data.result
    });
    
    // Provide helpful error messages
    if (data.message?.includes('Invalid API Key')) {
      throw new Error('Invalid Basescan API key. Please check your .env.local file.');
    } else if (data.message?.includes('rate limit')) {
      throw new Error('Basescan rate limit exceeded. Please try again in a moment.');
    } else if (data.message?.includes('NOTOK')) {
      throw new Error(`Basescan API error: ${data.result || data.message || 'Unknown error'}`);
    }
    
    throw new Error(`Basescan API error: ${data.message || data.result || 'Unknown error'}`);
  }
  
  return data;
}

// ============================================
// GAS PRICES
// ============================================

/**
 * Get current gas prices
 * Uses public Base RPC directly (Basescan V1 API is deprecated)
 * This is more reliable and doesn't require an API key
 */
export async function getGasPrices() {
  return cacheApiRequest(
    SERVICE,
    'gas_prices',
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        try {
          // Use public Base RPC directly (no API key needed, more reliable)
          const response = await fetch('https://mainnet.base.org', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_gasPrice',
              params: [],
              id: 1,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch gas price from Base RPC');
          }
          
          const rpcData = await response.json();
          
          if (rpcData.error) {
            throw new Error(`RPC Error: ${rpcData.error.message}`);
          }
          
          // eth_gasPrice returns a hex value in Wei
          // Convert to Gwei (1 Gwei = 10^9 Wei)
          const gasPriceWei = parseInt(rpcData.result, 16);
          const gasPriceGwei = gasPriceWei / 1e9;
          
          console.log('✅ Gas price fetched from Base RPC:', gasPriceGwei.toFixed(4), 'Gwei');
          
          return formatGasPrices(gasPriceGwei);
        } catch (error) {
          console.error('❌ Failed to fetch gas prices:', error.message);
          // Return reasonable default values if all methods fail
          return {
            safeGasPrice: '0.0009',
            proposeGasPrice: '0.0010',
            fastGasPrice: '0.0012',
            suggestBaseFee: '0.0010',
            gasUsedRatio: '0.5',
            lastBlock: 'Error',
          };
        }
      });
    },
    { duration: 30 * 1000 } // Cache for 30 seconds
  );
}

/**
 * Format gas prices with safe/standard/fast tiers
 * @param {number} standardGasGwei - Standard gas price in Gwei
 */
function formatGasPrices(standardGasGwei) {
  // Create safe/standard/fast estimates
  // Based on typical multipliers: safe = 0.9x, standard = 1x, fast = 1.2x
  const standardGas = standardGasGwei;
  const safeGas = standardGasGwei * 0.9;
  const fastGas = standardGasGwei * 1.2;
  
  console.log('✅ Gas prices calculated:', {
    safe: safeGas.toFixed(4),
    standard: standardGas.toFixed(4),
    fast: fastGas.toFixed(4)
  });
  
  return {
    safeGasPrice: safeGas.toFixed(4),
    proposeGasPrice: standardGas.toFixed(4),
    fastGasPrice: fastGas.toFixed(4),
    suggestBaseFee: standardGas.toFixed(4),
    gasUsedRatio: '0.5',
    lastBlock: 'Current',
  };
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

