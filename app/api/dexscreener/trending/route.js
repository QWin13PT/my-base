/**
 * DexScreener Trending Tokens API Route
 * Fetches trending tokens on Base network with volume, liquidity, and price data
 */

import { NextResponse } from 'next/server';

const DEXSCREENER_BASE = 'https://api.dexscreener.com';

// Popular Base token addresses for fallback
const POPULAR_BASE_TOKENS = [
  '0x4200000000000000000000000000000000000006', // WETH
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  '0x532f27101965dd16442e59d40670faf5ebb142e4', // BRETT
  '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', // DEGEN
  '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4', // TOSHI
  '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', // cbETH
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
  '0x940181a94A35A4569E4529A3CDfB74e38FD98631', // AERO
  '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b', // tBTC
  '0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9', // BSWAP
  '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b', // VIRTUAL
  '0x0Dc808adcE2099A9F62AA87D9670745AbA741746', // HIGHER
  '0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdD21b', // PRIME
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'volume'; // volume, txns, priceChange

    console.log(`📍 Fetching trending Base tokens from DexScreener (limit: ${limit}, sort: ${sortBy})`);

    // Fetch ALL pairs from Base network using popular Base tokens
    // This gets us real trading data from the Base chain
    console.log('📍 Fetching Base chain pairs data...');
    
    const pairPromises = POPULAR_BASE_TOKENS.map(async (address) => {
      try {
        const pairResponse = await fetch(`${DEXSCREENER_BASE}/latest/dex/tokens/${address}`);
        
        if (!pairResponse.ok) {
          return [];
        }
        
        const pairData = await pairResponse.json();
        
        // Get all Base pairs for this token
        const basePairs = pairData.pairs
          ?.filter(p => p.chainId === 'base')
          || [];
        
        return basePairs;
      } catch (err) {
        console.warn(`Failed to fetch pair for ${address}:`, err.message);
        return [];
      }
    });

    const allPairsNested = await Promise.all(pairPromises);
    const allPairs = allPairsNested.flat();
    
    console.log(`📍 Found ${allPairs.length} total Base chain pairs`);
    
    // Extract unique tokens from all these pairs
    const tokenMap = new Map();
    
    allPairs.forEach(pair => {
      const tokenAddress = pair.baseToken?.address;
      if (!tokenAddress) return;
      
      // Keep the pair with highest liquidity for each token
      const existing = tokenMap.get(tokenAddress);
      const currentLiquidity = parseFloat(pair.liquidity?.usd || 0);
      const existingLiquidity = existing ? parseFloat(existing.liquidity?.usd || 0) : 0;
      
      if (!existing || currentLiquidity > existingLiquidity) {
        tokenMap.set(tokenAddress, pair);
      }
    });
    
    const pairs = Array.from(tokenMap.values());
    
    console.log(`📍 Found ${pairs.length} unique tokens`);
    
    console.log(`📍 Successfully fetched ${pairs.length} pairs`);

    // Process and filter pairs
    const tokens = pairs
      .filter(pair => {
        // Filter out low quality tokens (relaxed filters for more results)
        return (
          pair.baseToken?.address &&
          pair.priceUsd &&
          parseFloat(pair.liquidity?.usd || 0) >= 500 && // Minimum $500 liquidity
          parseFloat(pair.volume?.h24 || 0) >= 50 // Minimum $50 24h volume
        );
      })
      .map(pair => ({
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        logo: pair.info?.imageUrl,
        price: parseFloat(pair.priceUsd || 0),
        priceChange24h: parseFloat(pair.priceChange?.h24 || 0),
        priceChange6h: parseFloat(pair.priceChange?.h6 || 0),
        priceChange1h: parseFloat(pair.priceChange?.h1 || 0),
        volume24h: parseFloat(pair.volume?.h24 || 0),
        volume6h: parseFloat(pair.volume?.h6 || 0),
        marketCap: parseFloat(pair.fdv || pair.marketCap || 0),
        liquidity: parseFloat(pair.liquidity?.usd || 0),
        txns24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
        txns6h: (pair.txns?.h6?.buys || 0) + (pair.txns?.h6?.sells || 0),
        pairAddress: pair.pairAddress,
        dexId: pair.dexId,
        url: pair.url || `https://dexscreener.com/base/${pair.pairAddress}`,
      }));

    // Tokens are already unique from the tokenMap above
    let uniqueTokens = tokens;

    // Sort based on criteria
    switch (sortBy) {
      case 'volume':
        uniqueTokens.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'txns':
        uniqueTokens.sort((a, b) => b.txns24h - a.txns24h);
        break;
      case 'priceChange':
        uniqueTokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
        break;
      case 'gainers':
        uniqueTokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
        break;
      case 'losers':
        uniqueTokens.sort((a, b) => a.priceChange24h - b.priceChange24h);
        break;
      case 'volatility':
        uniqueTokens.sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h));
        break;
      case 'liquidity':
        uniqueTokens.sort((a, b) => b.liquidity - a.liquidity);
        break;
      default:
        uniqueTokens.sort((a, b) => b.volume24h - a.volume24h);
    }

    // Limit results
    const result = uniqueTokens.slice(0, limit);

    console.log(`✅ Returning ${result.length} trending tokens`);

    return NextResponse.json({
      tokens: result,
      count: result.length,
      sortBy,
    });

  } catch (error) {
    console.error('❌ Error in DexScreener trending route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

