/**
 * Moralis API Service
 * Wrapper for Moralis Web3 Data API with rate limiting and caching
 * Focus: Wallet Data, Token Balances, NFTs, Transactions
 * Documentation: https://docs.moralis.com/web3-data-api/evm/reference
 */

import { API_CONFIG, API_KEYS, buildApiUrl, getApiHeaders, CACHE_DURATIONS } from '@/config/api-endpoints';
import { cacheApiRequest } from '@/lib/utils/cache';
import { makeTrackedRequest } from '@/lib/utils/rate-limiter';

const SERVICE = 'moralis';
const CHAIN = API_CONFIG.moralis.chainId; // Base chain ID (0x2105)

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Make Moralis API request
 */
async function fetchFromMoralis(endpoint, params = {}) {
  const url = buildApiUrl(SERVICE, endpoint, { ...params, chain: CHAIN });
  const headers = getApiHeaders(SERVICE);
  
  if (!API_KEYS.moralis) {
    throw new Error('Moralis API key is not configured. Please add NEXT_PUBLIC_MORALIS_API_KEY to your .env.local file');
  }
  
  const response = await fetch(url, {
    headers,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Moralis API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

// ============================================
// WALLET TOKEN BALANCES
// ============================================

/**
 * Get ERC20 token balances for a wallet
 * @param {string} address - Wallet address
 * @param {Object} options - Additional options (limit, cursor)
 * @returns {Promise<Object>} Token balances with metadata
 */
export async function getWalletTokenBalances(address, options = {}) {
  if (!address) {
    throw new Error('Wallet address is required');
  }
  
  const endpoint = API_CONFIG[SERVICE].endpoints.walletTokens(address);
  
  return cacheApiRequest(
    SERVICE,
    `wallet_tokens_${address}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromMoralis(endpoint, options);
        
        // Transform response to include useful data
        return data.map(token => ({
          tokenAddress: token.token_address,
          name: token.name,
          symbol: token.symbol,
          logo: token.logo,
          thumbnail: token.thumbnail,
          decimals: token.decimals,
          balance: token.balance,
          balanceFormatted: token.balance_formatted,
          possibleSpam: token.possible_spam,
          verifiedContract: token.verified_contract,
          usdValue: token.usd_value || null,
          usdPrice: token.usd_price || null,
          usdPrice24hrPercentChange: token.usd_price_24hr_percent_change || null,
        }));
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

/**
 * Get native token balance (ETH on Base)
 * @param {string} address - Wallet address
 * @returns {Promise<Object>} Native balance
 */
export async function getWalletNativeBalance(address) {
  if (!address) {
    throw new Error('Wallet address is required');
  }
  
  const endpoint = API_CONFIG[SERVICE].endpoints.nativeBalance(address);
  
  return cacheApiRequest(
    SERVICE,
    `native_balance_${address}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        return fetchFromMoralis(endpoint);
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

/**
 * Get complete wallet portfolio (native + ERC20 tokens)
 * @param {string} address - Wallet address
 * @returns {Promise<Object>} Complete portfolio with USD values
 */
export async function getWalletPortfolio(address) {
  if (!address) {
    throw new Error('Wallet address is required');
  }
  
  return cacheApiRequest(
    SERVICE,
    `portfolio_${address}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const [nativeBalance, tokenBalances] = await Promise.all([
          getWalletNativeBalance(address),
          getWalletTokenBalances(address),
        ]);
        
        // Calculate total portfolio value
        const tokenTotalValue = tokenBalances.reduce((sum, token) => {
          return sum + (parseFloat(token.usdValue) || 0);
        }, 0);
        
        const nativeValue = parseFloat(nativeBalance.balance) / Math.pow(10, 18);
        
        return {
          address,
          nativeBalance: {
            balance: nativeBalance.balance,
            balanceFormatted: (parseFloat(nativeBalance.balance) / Math.pow(10, 18)).toFixed(6),
            symbol: 'ETH',
          },
          tokens: tokenBalances,
          totalTokensUsdValue: tokenTotalValue,
          totalAssets: tokenBalances.length + 1, // +1 for native token
        };
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

// ============================================
// TOKEN PRICES
// ============================================

/**
 * Get token price by contract address
 * @param {string} tokenAddress - Token contract address
 * @returns {Promise<Object>} Token price data
 */
export async function getTokenPrice(tokenAddress) {
  if (!tokenAddress) {
    throw new Error('Token address is required');
  }
  
  const endpoint = API_CONFIG[SERVICE].endpoints.tokenPrice.replace(':address', tokenAddress);
  
  return cacheApiRequest(
    SERVICE,
    `token_price_${tokenAddress}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromMoralis(endpoint);
        
        return {
          tokenAddress: data.tokenAddress,
          tokenName: data.tokenName,
          tokenSymbol: data.tokenSymbol,
          tokenLogo: data.tokenLogo,
          tokenDecimals: data.tokenDecimals,
          nativePrice: data.nativePrice,
          usdPrice: data.usdPrice,
          usdPriceFormatted: data.usdPriceFormatted,
          exchangeAddress: data.exchangeAddress,
          exchangeName: data.exchangeName,
          '24hrPercentChange': data['24hrPercentChange'],
        };
      });
    },
    { duration: CACHE_DURATIONS.prices }
  );
}

/**
 * Get token metadata (name, symbol, decimals, etc.)
 * @param {string[]} addresses - Array of token contract addresses
 * @returns {Promise<Array>} Token metadata
 */
export async function getTokenMetadata(addresses) {
  if (!addresses || addresses.length === 0) {
    throw new Error('Token addresses are required');
  }
  
  const endpoint = API_CONFIG[SERVICE].endpoints.tokenMetadata;
  
  return cacheApiRequest(
    SERVICE,
    `token_metadata_${addresses.join('_')}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        return fetchFromMoralis(endpoint, { 
          addresses: addresses.join(',')
        });
      });
    },
    { duration: CACHE_DURATIONS.tokenMetadata }
  );
}

// ============================================
// WALLET TRANSACTIONS
// ============================================

/**
 * Get wallet transaction history
 * @param {string} address - Wallet address
 * @param {Object} options - Pagination options (cursor, limit)
 * @returns {Promise<Object>} Transaction history
 */
export async function getWalletTransactions(address, options = {}) {
  if (!address) {
    throw new Error('Wallet address is required');
  }
  
  const endpoint = API_CONFIG[SERVICE].endpoints.walletTransactions(address);
  
  return cacheApiRequest(
    SERVICE,
    `wallet_txs_${address}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromMoralis(endpoint, {
          ...options,
          limit: options.limit || 25,
        });
        
        return {
          total: data.total,
          page: data.page,
          pageSize: data.page_size,
          cursor: data.cursor,
          result: data.result?.map(tx => ({
            hash: tx.hash,
            nonce: tx.nonce,
            transactionIndex: tx.transaction_index,
            fromAddress: tx.from_address,
            toAddress: tx.to_address,
            value: tx.value,
            gas: tx.gas,
            gasPrice: tx.gas_price,
            receiptGasUsed: tx.receipt_gas_used,
            blockTimestamp: tx.block_timestamp,
            blockNumber: tx.block_number,
            blockHash: tx.block_hash,
          })),
        };
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

// ============================================
// NFT DATA
// ============================================

/**
 * Get NFTs owned by wallet
 * @param {string} address - Wallet address
 * @param {Object} options - Additional options (limit, cursor)
 * @returns {Promise<Object>} NFT collection
 */
export async function getWalletNFTs(address, options = {}) {
  if (!address) {
    throw new Error('Wallet address is required');
  }
  
  const endpoint = API_CONFIG[SERVICE].endpoints.walletNFTs(address);
  
  return cacheApiRequest(
    SERVICE,
    `wallet_nfts_${address}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromMoralis(endpoint, {
          ...options,
          limit: options.limit || 50,
        });
        
        return {
          total: data.total,
          page: data.page,
          pageSize: data.page_size,
          cursor: data.cursor,
          result: data.result?.map(nft => ({
            tokenAddress: nft.token_address,
            tokenId: nft.token_id,
            ownerOf: nft.owner_of,
            amount: nft.amount,
            tokenHash: nft.token_hash,
            blockNumber: nft.block_number,
            contractType: nft.contract_type,
            name: nft.name,
            symbol: nft.symbol,
            tokenUri: nft.token_uri,
            metadata: nft.metadata ? JSON.parse(nft.metadata) : null,
            lastTokenUriSync: nft.last_token_uri_sync,
            lastMetadataSync: nft.last_metadata_sync,
            possibleSpam: nft.possible_spam,
            verifiedCollection: nft.verified_collection,
          })),
        };
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format token balance with proper decimals
 * @param {string} balance - Raw balance string
 * @param {number} decimals - Token decimals
 * @returns {string} Formatted balance
 */
export function formatTokenBalance(balance, decimals) {
  const value = parseFloat(balance) / Math.pow(10, decimals);
  return value.toFixed(6);
}

/**
 * Get wallet summary (balances + transaction count)
 * @param {string} address - Wallet address
 * @returns {Promise<Object>} Wallet summary
 */
export async function getWalletSummary(address) {
  if (!address) {
    throw new Error('Wallet address is required');
  }
  
  return cacheApiRequest(
    SERVICE,
    `wallet_summary_${address}`,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const [portfolio, transactions, nfts] = await Promise.all([
          getWalletPortfolio(address),
          getWalletTransactions(address, { limit: 1 }),
          getWalletNFTs(address, { limit: 1 }),
        ]);
        
        return {
          address,
          portfolio,
          transactionCount: transactions.total || 0,
          nftCount: nfts.total || 0,
        };
      });
    },
    { duration: CACHE_DURATIONS.walletBalances }
  );
}

// Export all functions
export default {
  getWalletTokenBalances,
  getWalletNativeBalance,
  getWalletPortfolio,
  getTokenPrice,
  getTokenMetadata,
  getWalletTransactions,
  getWalletNFTs,
  formatTokenBalance,
  getWalletSummary,
};

