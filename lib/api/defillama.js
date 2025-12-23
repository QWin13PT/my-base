/**
 * DeFiLlama API Service
 * Wrapper for DeFiLlama API with rate limiting and caching
 * Focus: TVL, Protocol Data, Network Statistics
 */

import { API_CONFIG, buildApiUrl, CACHE_DURATIONS } from '@/config/api-endpoints';
import { cacheApiRequest } from '@/lib/utils/cache';
import { makeTrackedRequest } from '@/lib/utils/rate-limiter';

const SERVICE = 'defiLlama';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Make DeFiLlama API request
 */
async function fetchFromDeFiLlama(endpoint, params = {}) {
  const url = buildApiUrl(SERVICE, endpoint, params);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================
// CHAIN DATA
// ============================================

/**
 * Get all chains TVL data
 */
export async function getAllChains() {
  const endpoint = API_CONFIG[SERVICE].endpoints.chains;
  
  return cacheApiRequest(
    SERVICE,
    endpoint,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        return fetchFromDeFiLlama(endpoint);
      });
    },
    { duration: CACHE_DURATIONS.networkStats }
  );
}

/**
 * Get Base chain specific data
 */
export async function getBaseChainData() {
  const endpoint = API_CONFIG[SERVICE].endpoints.baseChain;
  
  return cacheApiRequest(
    SERVICE,
    endpoint,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const data = await fetchFromDeFiLlama(endpoint);
        
        return {
          gecko_id: data.gecko_id,
          tvl: data.tvl,
          tokenSymbol: data.tokenSymbol,
          cmcId: data.cmcId,
          name: data.name,
          chainId: data.chainId,
        };
      });
    },
    { duration: CACHE_DURATIONS.networkStats }
  );
}

/**
 * Get Base current TVL
 */
export async function getBaseTVL() {
  const endpoint = API_CONFIG[SERVICE].endpoints.currentTVL;
  
  return cacheApiRequest(
    SERVICE,
    endpoint,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        return fetchFromDeFiLlama(endpoint);
      });
    },
    { duration: CACHE_DURATIONS.networkStats }
  );
}

// ============================================
// PROTOCOL DATA
// ============================================

/**
 * Get all protocols
 */
export async function getAllProtocols() {
  const endpoint = API_CONFIG[SERVICE].endpoints.protocols;
  
  return cacheApiRequest(
    SERVICE,
    endpoint,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        return fetchFromDeFiLlama(endpoint);
      });
    },
    { duration: CACHE_DURATIONS.networkStats }
  );
}

/**
 * Get protocols on Base chain
 */
export async function getBaseProtocols() {
  return cacheApiRequest(
    SERVICE,
    'base_protocols',
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const allProtocols = await getAllProtocols();
        
        // Filter protocols that are on Base chain
        return allProtocols.data.filter(protocol => {
          if (Array.isArray(protocol.chains)) {
            return protocol.chains.includes('Base');
          }
          return protocol.chain === 'Base';
        }).map(protocol => ({
          id: protocol.id,
          name: protocol.name,
          symbol: protocol.symbol,
          tvl: protocol.tvl,
          chainTvls: protocol.chainTvls?.Base || 0,
          change_1h: protocol.change_1h,
          change_1d: protocol.change_1d,
          change_7d: protocol.change_7d,
          category: protocol.category,
          logo: protocol.logo,
          url: protocol.url,
        }));
      });
    },
    { duration: CACHE_DURATIONS.networkStats }
  );
}

/**
 * Get specific protocol details
 * @param {string} protocol - Protocol slug/name
 */
export async function getProtocolDetails(protocol) {
  const endpoint = API_CONFIG[SERVICE].endpoints.protocol(protocol);
  
  return cacheApiRequest(
    SERVICE,
    endpoint,
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        return fetchFromDeFiLlama(endpoint);
      });
    },
    { duration: CACHE_DURATIONS.networkStats }
  );
}

// ============================================
// FORMATTED DATA FOR WIDGETS
// ============================================

/**
 * Get Base network statistics summary
 */
export async function getBaseNetworkStats() {
  return cacheApiRequest(
    SERVICE,
    'base_network_stats',
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const [chainData, protocols] = await Promise.all([
          getBaseChainData(),
          getBaseProtocols(),
        ]);
        
        const totalProtocolTvl = protocols.reduce((sum, p) => sum + (p.tvl || 0), 0);
        
        return {
          chainName: 'Base',
          tvl: chainData.tvl,
          protocolCount: protocols.length,
          totalProtocolTvl,
          topProtocols: protocols
            .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
            .slice(0, 10),
        };
      });
    },
    { duration: CACHE_DURATIONS.networkStats }
  );
}

/**
 * Get top protocols on Base by TVL
 * @param {number} limit - Number of protocols to return (default: 10)
 */
export async function getTopBaseProtocols(limit = 10) {
  const protocols = await getBaseProtocols();
  
  return protocols
    .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
    .slice(0, limit);
}

/**
 * Get protocols by category on Base
 * @param {string} category - Protocol category (e.g., 'DEX', 'Lending', 'Yield')
 */
export async function getBaseProtocolsByCategory(category) {
  const protocols = await getBaseProtocols();
  
  return protocols.filter(p => 
    p.category?.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get TVL change data for Base
 */
export async function getBaseTVLChange() {
  return cacheApiRequest(
    SERVICE,
    'base_tvl_change',
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const protocols = await getBaseProtocols();
        
        const totalChange1h = protocols.reduce((sum, p) => sum + (p.change_1h || 0), 0) / protocols.length;
        const totalChange1d = protocols.reduce((sum, p) => sum + (p.change_1d || 0), 0) / protocols.length;
        const totalChange7d = protocols.reduce((sum, p) => sum + (p.change_7d || 0), 0) / protocols.length;
        
        return {
          change1h: totalChange1h,
          change1d: totalChange1d,
          change7d: totalChange7d,
        };
      });
    },
    { duration: CACHE_DURATIONS.networkStats }
  );
}

// ============================================
// COMPARISON DATA
// ============================================

/**
 * Compare Base with other L2 chains
 */
export async function compareL2Chains() {
  return cacheApiRequest(
    SERVICE,
    'l2_comparison',
    {},
    async () => {
      return makeTrackedRequest(SERVICE, async () => {
        const allChains = await getAllChains();
        
        // Filter for major L2s
        const l2Names = ['Base', 'Arbitrum', 'Optimism', 'Polygon', 'zkSync Era'];
        
        return allChains
          .filter(chain => l2Names.includes(chain.name))
          .map(chain => ({
            name: chain.name,
            tvl: chain.tvl,
            tokenSymbol: chain.tokenSymbol,
            chainId: chain.chainId,
          }))
          .sort((a, b) => b.tvl - a.tvl);
      });
    },
    { duration: CACHE_DURATIONS.networkStats }
  );
}

// Export all functions
export default {
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
};

