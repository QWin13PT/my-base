/**
 * Moralis Wallet Balance API Route
 * Proxies requests to Moralis API to get wallet token balances
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

    // Get wallet address from query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log(`📍 Fetching balance for wallet: ${address}`);

    // Make request to Moralis API
    const moralisUrl = `${MORALIS_BASE_URL}/${address}/erc20?chain=${CHAIN}`;
    
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
    console.log(`✅ Balance fetched successfully for ${address}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error in Moralis wallet balance route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

