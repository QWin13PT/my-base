/**
 * Rate Limiter Utility
 * Implements token bucket algorithm for API rate limiting
 * Ensures we stay within free tier limits for all services
 */

import { API_CONFIG } from '@/config/api-endpoints';

// ============================================
// RATE LIMITER CLASS
// ============================================

class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests; // Max requests allowed
    this.timeWindow = timeWindow; // Time window in milliseconds
    this.requests = []; // Array of request timestamps
    this.queue = []; // Queue of pending requests
    this.processing = false;
  }

  /**
   * Clean up old requests outside the time window
   */
  cleanup() {
    const now = Date.now();
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.timeWindow
    );
  }

  /**
   * Check if we can make a request
   */
  canMakeRequest() {
    this.cleanup();
    return this.requests.length < this.maxRequests;
  }

  /**
   * Get time until next available slot
   */
  getTimeUntilNextSlot() {
    if (this.canMakeRequest()) return 0;
    
    this.cleanup();
    if (this.canMakeRequest()) return 0;
    
    // Calculate when the oldest request will expire
    const oldestRequest = this.requests[0];
    const timeUntilExpire = this.timeWindow - (Date.now() - oldestRequest);
    return Math.max(0, timeUntilExpire);
  }

  /**
   * Wait for available slot
   */
  async waitForSlot() {
    const waitTime = this.getTimeUntilNextSlot();
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Record a request
   */
  recordRequest() {
    this.requests.push(Date.now());
  }

  /**
   * Execute a function with rate limiting
   */
  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process queued requests
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      await this.waitForSlot();
      
      const item = this.queue.shift();
      this.recordRequest();
      
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }
    
    this.processing = false;
  }

  /**
   * Get current rate limit status
   */
  getStatus() {
    this.cleanup();
    return {
      requests: this.requests.length,
      maxRequests: this.maxRequests,
      available: this.maxRequests - this.requests.length,
      queueLength: this.queue.length,
      nextSlotIn: this.getTimeUntilNextSlot(),
    };
  }

  /**
   * Reset rate limiter
   */
  reset() {
    this.requests = [];
    this.queue = [];
    this.processing = false;
  }
}

// ============================================
// SERVICE-SPECIFIC RATE LIMITERS
// ============================================

// Create rate limiters for each API service
const rateLimiters = {};

/**
 * Get or create rate limiter for a service
 */
function getRateLimiter(service) {
  if (!rateLimiters[service]) {
    const config = API_CONFIG[service];
    if (!config) {
      throw new Error(`Unknown API service: ${service}`);
    }
    
    const { rateLimit } = config.free;
    // Convert requests per minute to time window
    const timeWindow = 60 * 1000; // 1 minute
    
    rateLimiters[service] = new RateLimiter(rateLimit, timeWindow);
  }
  
  return rateLimiters[service];
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Execute an API call with rate limiting
 */
export async function rateLimitedRequest(service, requestFn) {
  const limiter = getRateLimiter(service);
  return limiter.execute(requestFn);
}

/**
 * Check if we can make a request to a service
 */
export function canMakeRequest(service) {
  const limiter = getRateLimiter(service);
  return limiter.canMakeRequest();
}

/**
 * Get rate limit status for a service
 */
export function getRateLimitStatus(service) {
  const limiter = getRateLimiter(service);
  return limiter.getStatus();
}

/**
 * Get rate limit status for all services
 */
export function getAllRateLimitStatus() {
  return Object.keys(rateLimiters).reduce((acc, service) => {
    acc[service] = getRateLimitStatus(service);
    return acc;
  }, {});
}

/**
 * Reset rate limiter for a service
 */
export function resetRateLimiter(service) {
  const limiter = getRateLimiter(service);
  limiter.reset();
}

/**
 * Reset all rate limiters
 */
export function resetAllRateLimiters() {
  Object.values(rateLimiters).forEach(limiter => limiter.reset());
}

// ============================================
// BATCH REQUESTS
// ============================================

/**
 * Execute multiple requests with rate limiting
 * Returns results in the same order as requests
 */
export async function batchRateLimitedRequests(service, requestFns) {
  const limiter = getRateLimiter(service);
  
  const promises = requestFns.map(fn => limiter.execute(fn));
  
  return Promise.all(promises);
}

/**
 * Execute multiple requests with rate limiting
 * Returns results as they complete (unordered)
 */
export async function batchRateLimitedRequestsUnordered(service, requestFns) {
  const limiter = getRateLimiter(service);
  
  const promises = requestFns.map(async (fn, index) => {
    try {
      const result = await limiter.execute(fn);
      return { index, result, error: null };
    } catch (error) {
      return { index, result: null, error };
    }
  });
  
  return Promise.allSettled(promises);
}

// ============================================
// USAGE TRACKING (for monthly limits)
// ============================================

const USAGE_KEY_PREFIX = 'api_usage_';

/**
 * Get usage key for a service and month
 */
function getUsageKey(service) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `${USAGE_KEY_PREFIX}${service}_${month}`;
}

/**
 * Track API usage (for monthly limits)
 */
export function trackApiUsage(service) {
  if (typeof window === 'undefined') return;
  
  const key = getUsageKey(service);
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(current + 1));
}

/**
 * Get API usage for current month
 */
export function getApiUsage(service) {
  if (typeof window === 'undefined') return 0;
  
  const key = getUsageKey(service);
  return parseInt(localStorage.getItem(key) || '0', 10);
}

/**
 * Get API usage for all services
 */
export function getAllApiUsage() {
  if (typeof window === 'undefined') return {};
  
  return Object.keys(API_CONFIG).reduce((acc, service) => {
    acc[service] = {
      used: getApiUsage(service),
      limit: API_CONFIG[service].free.limit,
      percentage: (getApiUsage(service) / API_CONFIG[service].free.limit) * 100,
    };
    return acc;
  }, {});
}

/**
 * Check if service is near limit (>80%)
 */
export function isNearLimit(service) {
  const usage = getApiUsage(service);
  const limit = API_CONFIG[service].free.limit;
  
  if (limit === Infinity) return false;
  
  return (usage / limit) > 0.8;
}

/**
 * Check if service has exceeded limit
 */
export function hasExceededLimit(service) {
  const usage = getApiUsage(service);
  const limit = API_CONFIG[service].free.limit;
  
  if (limit === Infinity) return false;
  
  return usage >= limit;
}

/**
 * Reset usage tracking (useful for testing)
 */
export function resetUsageTracking() {
  if (typeof window === 'undefined') return;
  
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(USAGE_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

// ============================================
// COMBINED REQUEST WITH RATE LIMITING AND TRACKING
// ============================================

/**
 * Make an API request with rate limiting and usage tracking
 */
export async function makeTrackedRequest(service, requestFn) {
  // Check if near/exceeded limit
  if (hasExceededLimit(service)) {
    throw new Error(`API limit exceeded for ${service}. Please try again next month.`);
  }
  
  // Warn if near limit
  if (isNearLimit(service)) {
    console.warn(`Warning: ${service} API usage is above 80% of monthly limit`);
  }
  
  // Execute with rate limiting
  const result = await rateLimitedRequest(service, requestFn);
  
  // Track usage
  trackApiUsage(service);
  
  return result;
}

// ============================================
// EXPORT
// ============================================

export default {
  rateLimitedRequest,
  canMakeRequest,
  getRateLimitStatus,
  getAllRateLimitStatus,
  resetRateLimiter,
  resetAllRateLimiters,
  batchRateLimitedRequests,
  batchRateLimitedRequestsUnordered,
  trackApiUsage,
  getApiUsage,
  getAllApiUsage,
  isNearLimit,
  hasExceededLimit,
  resetUsageTracking,
  makeTrackedRequest,
};

