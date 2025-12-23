/**
 * Caching Utility for API Responses
 * Implements both memory cache and localStorage persistence
 * Optimizes API usage for free tier limits
 */

// ============================================
// IN-MEMORY CACHE
// ============================================
const memoryCache = new Map();

// ============================================
// CACHE KEY GENERATION
// ============================================

/**
 * Generate cache key from service, endpoint, and params
 */
function generateCacheKey(service, endpoint, params = {}) {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `api_${service}_${endpoint}_${paramString}`;
}

// ============================================
// MEMORY CACHE OPERATIONS
// ============================================

/**
 * Set item in memory cache with expiration
 */
function setMemoryCache(key, data, duration) {
  const expiresAt = Date.now() + duration;
  memoryCache.set(key, {
    data,
    expiresAt,
    cachedAt: Date.now(),
  });
}

/**
 * Get item from memory cache
 */
function getMemoryCache(key) {
  const cached = memoryCache.get(key);
  
  if (!cached) return null;
  
  // Check if expired
  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Clear memory cache
 */
export function clearMemoryCache() {
  memoryCache.clear();
}

/**
 * Remove expired items from memory cache
 */
export function cleanMemoryCache() {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (now > value.expiresAt) {
      memoryCache.delete(key);
    }
  }
}

// ============================================
// LOCALSTORAGE CACHE OPERATIONS
// ============================================

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Set item in localStorage cache with expiration
 */
function setLocalStorageCache(key, data, duration) {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const cacheItem = {
      data,
      expiresAt: Date.now() + duration,
      cachedAt: Date.now(),
    };
    
    localStorage.setItem(key, JSON.stringify(cacheItem));
    return true;
  } catch (e) {
    // Handle quota exceeded or other errors
    console.warn('localStorage cache error:', e);
    return false;
  }
}

/**
 * Get item from localStorage cache
 */
function getLocalStorageCache(key) {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const cached = JSON.parse(item);
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cached.data;
  } catch (e) {
    console.warn('localStorage cache read error:', e);
    return null;
  }
}

/**
 * Clear localStorage cache (only API cache keys)
 */
export function clearLocalStorageCache() {
  if (!isLocalStorageAvailable()) return;
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('api_')) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Clean expired items from localStorage
 */
export function cleanLocalStorageCache() {
  if (!isLocalStorageAvailable()) return;
  
  const now = Date.now();
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith('api_')) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const cached = JSON.parse(item);
          if (now > cached.expiresAt) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Remove corrupted items
        localStorage.removeItem(key);
      }
    }
  });
}

// ============================================
// UNIFIED CACHE INTERFACE
// ============================================

/**
 * Cache strategies
 */
export const CacheStrategy = {
  MEMORY_ONLY: 'memory',
  LOCALSTORAGE_ONLY: 'localStorage',
  MEMORY_FIRST: 'memoryFirst', // Check memory, then localStorage
  BOTH: 'both', // Store in both
};

/**
 * Set data in cache
 */
export function setCache(key, data, duration, strategy = CacheStrategy.MEMORY_FIRST) {
  switch (strategy) {
    case CacheStrategy.MEMORY_ONLY:
      setMemoryCache(key, data, duration);
      break;
      
    case CacheStrategy.LOCALSTORAGE_ONLY:
      setLocalStorageCache(key, data, duration);
      break;
      
    case CacheStrategy.MEMORY_FIRST:
    case CacheStrategy.BOTH:
      setMemoryCache(key, data, duration);
      setLocalStorageCache(key, data, duration);
      break;
      
    default:
      setMemoryCache(key, data, duration);
  }
}

/**
 * Get data from cache
 */
export function getCache(key, strategy = CacheStrategy.MEMORY_FIRST) {
  switch (strategy) {
    case CacheStrategy.MEMORY_ONLY:
      return getMemoryCache(key);
      
    case CacheStrategy.LOCALSTORAGE_ONLY:
      return getLocalStorageCache(key);
      
    case CacheStrategy.MEMORY_FIRST:
      // Try memory first, fallback to localStorage
      const memoryData = getMemoryCache(key);
      if (memoryData !== null) return memoryData;
      
      const localData = getLocalStorageCache(key);
      if (localData !== null) {
        // Restore to memory cache
        setMemoryCache(key, localData, 30 * 1000); // 30 seconds default
        return localData;
      }
      return null;
      
    case CacheStrategy.BOTH:
      return getMemoryCache(key) || getLocalStorageCache(key);
      
    default:
      return getMemoryCache(key);
  }
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  clearMemoryCache();
  clearLocalStorageCache();
}

/**
 * Clean expired items from all caches
 */
export function cleanAllCaches() {
  cleanMemoryCache();
  cleanLocalStorageCache();
}

// ============================================
// HIGH-LEVEL CACHE FUNCTIONS
// ============================================

/**
 * Cache an API request result
 */
export async function cacheApiRequest(
  service,
  endpoint,
  params,
  fetchFn,
  options = {}
) {
  const {
    duration = 30 * 1000, // Default 30 seconds
    strategy = CacheStrategy.MEMORY_FIRST,
    forceRefresh = false,
  } = options;
  
  const cacheKey = generateCacheKey(service, endpoint, params);
  
  // Try to get from cache if not forcing refresh
  if (!forceRefresh) {
    const cached = getCache(cacheKey, strategy);
    if (cached !== null) {
      return { data: cached, cached: true };
    }
  }
  
  // Fetch fresh data
  try {
    const data = await fetchFn();
    
    // Cache the result
    setCache(cacheKey, data, duration, strategy);
    
    return { data, cached: false };
  } catch (error) {
    // If fetch fails, try to return stale cache data as fallback
    const staleData = getCache(cacheKey, strategy);
    if (staleData !== null) {
      console.warn('API fetch failed, using stale cache:', error);
      return { data: staleData, cached: true, stale: true };
    }
    
    throw error;
  }
}

/**
 * Invalidate cache for specific key
 */
export function invalidateCache(service, endpoint, params = {}) {
  const cacheKey = generateCacheKey(service, endpoint, params);
  
  // Remove from both caches
  memoryCache.delete(cacheKey);
  
  if (isLocalStorageAvailable()) {
    localStorage.removeItem(cacheKey);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const memoryCacheSize = memoryCache.size;
  
  let localStorageCacheSize = 0;
  if (isLocalStorageAvailable()) {
    const keys = Object.keys(localStorage);
    localStorageCacheSize = keys.filter(key => key.startsWith('api_')).length;
  }
  
  return {
    memoryCache: {
      size: memoryCacheSize,
      entries: Array.from(memoryCache.keys()),
    },
    localStorageCache: {
      size: localStorageCacheSize,
    },
  };
}

// ============================================
// AUTO CLEANUP
// ============================================

// Clean up expired cache items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cleanAllCaches();
  }, 5 * 60 * 1000);
}

// Export everything
export default {
  setCache,
  getCache,
  clearAllCaches,
  cleanAllCaches,
  cacheApiRequest,
  invalidateCache,
  getCacheStats,
  CacheStrategy,
  generateCacheKey,
};

