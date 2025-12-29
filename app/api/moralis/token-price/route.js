/**
 * Moralis Token Price API Route
 * Proxies requests to Moralis API to keep API key secure on server side
 */

import { NextResponse } from 'next/server';

const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';
const CHAIN = '0x2105'; // Base chain ID

export async function GET(request) {
  try {
    // Check if API key is configured
    if (!MORALIS_API_KEY) {
      console.error('❌ Moralis API key is not configured');
      return NextResponse.json(
        { error: 'Moralis API key not configured' },
        { status: 500 }
      );
    }

    // Get token address from query params
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('address');

    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Token address is required' },
        { status: 400 }
      );
    }

    console.log(`📍 Fetching price for token: ${tokenAddress}`);

    // Make request to Moralis API
    const moralisUrl = `${MORALIS_BASE_URL}/erc20/${tokenAddress}/price?chain=${CHAIN}`;
    
    const response = await fetch(moralisUrl, {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Moralis API error: ${response.status} - ${errorText}`);
      
      return NextResponse.json(
        { 
          error: `Moralis API error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Price fetched successfully for ${tokenAddress}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error in Moralis token price route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

