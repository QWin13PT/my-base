/**
 * Next.js API Route: Proxy for GeckoTerminal OHLCV API
 * This provides DEX pool chart data without CORS issues
 */

import { NextResponse } from 'next/server';

// In-memory cache
const cache = new Map();
const poolCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const POOL_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Find the best pool for a token
async function findBestPool(contractAddress) {
  // Check cache first
  const cached = poolCache.get(contractAddress);
  if (cached && Date.now() - cached.timestamp < POOL_CACHE_DURATION) {
    return cached.poolAddress;
  }

  // Search for pools with this token
  const searchUrl = `https://api.geckoterminal.com/api/v2/networks/base/tokens/${contractAddress}/pools?page=1`;
  
  console.log('🔍 Searching for pools:', searchUrl);

  const response = await fetch(searchUrl, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to find pools: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No pools found for this token on Base');
  }

  // Sort by liquidity and get the best pool
  const pools = data.data;
  const bestPool = pools.sort((a, b) => {
    const aLiq = parseFloat(a.attributes?.reserve_in_usd || 0);
    const bLiq = parseFloat(b.attributes?.reserve_in_usd || 0);
    return bLiq - aLiq;
  })[0];

  const poolAddress = bestPool.attributes.address;
  
  // Cache the pool address
  poolCache.set(contractAddress, {
    poolAddress,
    timestamp: Date.now(),
  });

  console.log('✅ Found best pool:', poolAddress);
  return poolAddress;
}

// Get timeframe based on days
function getTimeframe(days) {
  if (days <= 1) return 'minute'; // 24 hours
  if (days <= 7) return 'hour'; // 7 days
  if (days <= 90) return 'day'; // 90 days
  return 'day'; // 365 days
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contract_address');
    const days = parseInt(searchParams.get('days') || '7');

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'contract_address parameter is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${contractAddress}_${days}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Serving cached chart data');
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Find the best pool for this token
    const poolAddress = await findBestPool(contractAddress);

    // Get appropriate timeframe and limit
    const timeframe = getTimeframe(days);
    let limit = 1000; // Maximum allowed
    
    // Adjust limit based on timeframe to get appropriate data points
    if (timeframe === 'minute') limit = Math.min(1440, 1000); // 24 hours of minutes
    else if (timeframe === 'hour') limit = Math.min(days * 24, 1000); // hours
    else limit = Math.min(days, 1000); // days

    // Build GeckoTerminal API URL
    const geckoterminalUrl = `https://api.geckoterminal.com/api/v2/networks/base/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=1&limit=${limit}&currency=usd`;
    
    console.log('🔗 Fetching OHLCV data:', geckoterminalUrl);

    // Fetch from GeckoTerminal
    const response = await fetch(geckoterminalUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GeckoTerminal API error:', response.status, errorText);
      return NextResponse.json(
        { error: `GeckoTerminal API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ GeckoTerminal response received');

    // Transform OHLCV data
    // OHLCV format: [timestamp, open, high, low, close, volume]
    const ohlcv = data.data.attributes.ohlcv_list.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp: timestamp * 1000, // Convert to milliseconds
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseFloat(volume),
    }));

    // Also provide simple price array for backward compatibility
    const prices = ohlcv.map(item => [item.timestamp, item.close]);

    const result = {
      prices,
      ohlcv,
      timeframe,
      poolAddress,
    };

    // Cache the response
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    // Clean up old cache entries
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('❌ Market chart API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

