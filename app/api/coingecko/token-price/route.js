/**
 * Next.js API Route: Proxy for CoinGecko Token Price API
 * This bypasses CORS issues and handles rate limiting server-side
 */

import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddresses = searchParams.get('contract_addresses');
    const vsCurrencies = searchParams.get('vs_currencies') || 'usd';
    const include24hrChange = searchParams.get('include_24hr_change') === 'true';
    const include24hrVol = searchParams.get('include_24hr_vol') === 'true';
    const includeMarketCap = searchParams.get('include_market_cap') === 'true';

    if (!contractAddresses) {
      return NextResponse.json(
        { error: 'contract_addresses parameter is required' },
        { status: 400 }
      );
    }

    // Build CoinGecko API URL
    const params = new URLSearchParams({
      contract_addresses: contractAddresses,
      vs_currencies: vsCurrencies,
    });

    if (include24hrChange) params.append('include_24hr_change', 'true');
    if (include24hrVol) params.append('include_24hr_vol', 'true');
    if (includeMarketCap) params.append('include_market_cap', 'true');

    const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/token_price/base?${params.toString()}`;

    // Make request to CoinGecko
    const response = await fetch(coingeckoUrl, {
      headers: {
        'Accept': 'application/json',
      },
      // Add caching
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status, response.statusText);
      
      // Handle specific error codes
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `CoinGecko API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });

  } catch (error) {
    console.error('API Route error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

