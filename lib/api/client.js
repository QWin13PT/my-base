/**
 * Centralized API Client
 * Provides a consistent interface for making API requests with error handling,
 * retries, and monitoring integration
 */

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isRateLimitError() {
    return this.status === 429;
  }
}

/**
 * API Client Class
 */
export class ApiClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };
    this.interceptors = {
      request: [],
      response: [],
      error: [],
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor) {
    this.interceptors.error.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  async applyRequestInterceptors(url, options) {
    let modifiedUrl = url;
    let modifiedOptions = options;

    for (const interceptor of this.interceptors.request) {
      const result = await interceptor(modifiedUrl, modifiedOptions);
      if (result) {
        modifiedUrl = result.url || modifiedUrl;
        modifiedOptions = result.options || modifiedOptions;
      }
    }

    return { url: modifiedUrl, options: modifiedOptions };
  }

  /**
   * Apply response interceptors
   */
  async applyResponseInterceptors(response, data) {
    let modifiedResponse = response;
    let modifiedData = data;

    for (const interceptor of this.interceptors.response) {
      const result = await interceptor(modifiedResponse, modifiedData);
      if (result) {
        modifiedResponse = result.response || modifiedResponse;
        modifiedData = result.data || modifiedData;
      }
    }

    return { response: modifiedResponse, data: modifiedData };
  }

  /**
   * Apply error interceptors
   */
  async applyErrorInterceptors(error) {
    let modifiedError = error;

    for (const interceptor of this.interceptors.error) {
      const result = await interceptor(modifiedError);
      if (result) {
        modifiedError = result;
      }
    }

    return modifiedError;
  }

  /**
   * Main request method
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Merge options
    const requestOptions = {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      // Apply request interceptors
      const { url: interceptedUrl, options: interceptedOptions } = 
        await this.applyRequestInterceptors(url, requestOptions);

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 API Request:', interceptedUrl, {
          method: interceptedOptions.method || 'GET',
          headers: interceptedOptions.headers,
        });
      }

      // Make request
      const response = await fetch(interceptedUrl, interceptedOptions);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        let errorData = null;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // Error response is not JSON
        }

        const error = new ApiError(
          response.status,
          errorData?.error || errorData?.message || response.statusText,
          errorData
        );

        // Apply error interceptors
        throw await this.applyErrorInterceptors(error);
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Apply response interceptors
      const { data: interceptedData } = 
        await this.applyResponseInterceptors(response, data);

      // Log success in development
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ API Success:', interceptedUrl);
      }

      return interceptedData;

    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const networkError = new ApiError(
          0,
          'Network error. Please check your internet connection.',
          null
        );
        throw await this.applyErrorInterceptors(networkError);
      }

      // If it's already an ApiError that went through interceptors, rethrow
      if (error instanceof ApiError) {
        throw error;
      }

      // Unknown error
      console.error('❌ API Error:', error);
      throw await this.applyErrorInterceptors(error);
    }
  }

  /**
   * Convenience methods
   */
  async get(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
      ...options,
    });
  }

  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async patch(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

/**
 * Create and configure API clients for different services
 */

// Internal API client (Next.js API routes)
export const internalApiClient = new ApiClient('/api');

// Add default error interceptor for user-friendly messages
internalApiClient.addErrorInterceptor((error) => {
  if (error instanceof ApiError) {
    // Map status codes to user-friendly messages
    const userMessages = {
      400: 'Invalid request. Please check your input.',
      401: 'You need to be logged in to perform this action.',
      403: 'You don\'t have permission to perform this action.',
      404: 'The requested resource was not found.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      503: 'Service temporarily unavailable. Please try again later.',
    };

    // Use custom message if available, otherwise use user-friendly message
    if (!error.data?.error && userMessages[error.status]) {
      error.message = userMessages[error.status];
    }

    // Log errors to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with Sentry or other monitoring service
      // Sentry.captureException(error);
    }
  }

  return error;
});

// Add request timing interceptor for development
if (process.env.NODE_ENV === 'development') {
  internalApiClient.addRequestInterceptor((url, options) => {
    options._startTime = Date.now();
    return { url, options };
  });

  internalApiClient.addResponseInterceptor((response, data) => {
    const duration = Date.now() - (response._startTime || Date.now());
    console.log(`⏱️ Request took ${duration}ms`);
    return { response, data };
  });
}

// CoinGecko API client (external)
export const coinGeckoApiClient = new ApiClient('https://api.coingecko.com/api/v3');

// Add rate limit handling for CoinGecko
coinGeckoApiClient.addErrorInterceptor(async (error) => {
  if (error instanceof ApiError && error.isRateLimitError) {
    console.warn('⚠️ CoinGecko rate limit hit. Consider upgrading to Pro plan.');
    error.message = 'Rate limit exceeded. Prices will refresh in a moment.';
  }
  return error;
});

/**
 * Retry utility for failed requests
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    shouldRetry = (error) => error instanceof ApiError && error.isServerError,
  } = options;

  let lastError;
  let delay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or if we shouldn't retry this error
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;

      console.log(`🔄 Retrying request (attempt ${attempt + 2}/${maxRetries + 1})`);
    }
  }

  throw lastError;
}

/**
 * Request deduplication utility
 * Prevents multiple identical requests from being made simultaneously
 */
const pendingRequests = new Map();

export async function withDeduplication(key, fn) {
  // If request is already pending, return the existing promise
  if (pendingRequests.has(key)) {
    console.log(`♻️ Deduplicating request: ${key}`);
    return pendingRequests.get(key);
  }

  // Create new promise and store it
  const promise = fn()
    .finally(() => {
      // Clean up after request completes
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Export default client
 */
export default internalApiClient;

