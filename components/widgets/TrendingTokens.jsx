'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/cards/Card';
import { BASE_TOKENS, getAllTokenAddresses } from '@/config/base-tokens';
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';
import { useCurrency } from '@/lib/contexts/CurrencyContext';

export default function TrendingTokens({ 
  config = {}, 
  onUpdateConfig,
  onDelete 
}) {
  const [showTitle, setShowTitle] = useState(config.showTitle ?? true);
  const [showSubtitle, setShowSubtitle] = useState(config.showSubtitle ?? false);
  const [showImage, setShowImage] = useState(config.showImage ?? false);
  const [variant, setVariant] = useState(config.variant || 'default');
  const [isFixed, setIsFixed] = useState(config.isFixed || false);
  
  // Widget config
  const [showVolume, setShowVolume] = useState(config.showVolume ?? true);
  const [showMarketCap, setShowMarketCap] = useState(config.showMarketCap ?? false);
  const [limit, setLimit] = useState(config.limit || 10);
  const [sortBy, setSortBy] = useState(config.sortBy || 'volume'); // volume, price_change, market_cap
  
  // Use currency context
  const { currency, formatPrice: formatCurrencyPrice } = useCurrency();
  
  // Data state
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch token data
  useEffect(() => {
    console.log('🔥 TrendingTokens component mounted!');
    console.log('🔥 Config:', config);
    fetchTrendingTokens();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTrendingTokens();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [limit, sortBy]);

  async function fetchTrendingTokens() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📍 Fetching trending Base tokens from DexScreener...');
      
      // Fetch trending tokens across all chains from DexScreener
      // The token-profiles endpoint returns tokens with profiles (promoted/trending)
      const response = await fetch(
        `https://api.dexscreener.com/token-profiles/latest/v1`
      );
      
      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📍 DexScreener response:', data);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response format from DexScreener');
      }
      
      // Filter for Base chain tokens only
      const baseTokens = data.filter(profile => 
        profile.chainId?.toLowerCase() === 'base' && profile.tokenAddress
      );
      
      console.log('📍 Base token profiles found:', baseTokens.length);
      
      // If no Base tokens found in profiles, fetch from orders endpoint instead
      if (baseTokens.length === 0) {
        console.log('📍 No Base tokens in profiles, fetching from orders endpoint...');
        
        // Fallback: Get top pairs from Base chain directly
        const ordersResponse = await fetch(
          `https://api.dexscreener.com/orders/v1/base`
        );
        
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          console.log('📍 Orders response:', ordersData);
          
          // Extract unique tokens from orders
          if (Array.isArray(ordersData)) {
            const uniqueAddresses = new Set();
            const tokensFromOrders = [];
            
            for (const order of ordersData.slice(0, limit * 2)) {
              if (order.tokenAddress && !uniqueAddresses.has(order.tokenAddress)) {
                uniqueAddresses.add(order.tokenAddress);
                tokensFromOrders.push({
                  chainId: 'base',
                  tokenAddress: order.tokenAddress,
                  url: order.url || `https://dexscreener.com/base/${order.tokenAddress}`
                });
              }
            }
            
            baseTokens.push(...tokensFromOrders);
            console.log('📍 Base tokens from orders:', tokensFromOrders.length);
          }
        }
      }
      
      // If still no tokens, show message
      if (baseTokens.length === 0) {
        setTokens([]);
        setLoading(false);
        setError('No trending Base tokens found at the moment. Try refreshing.');
        return;
      }
      
      // Fetch pair data for these tokens (limit to avoid too many requests)
      const tokensToFetch = baseTokens.slice(0, Math.min(limit * 2, 30));
      const pairPromises = tokensToFetch.map(async (profile) => {
        try {
          const pairResponse = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${profile.tokenAddress}`
          );
          if (pairResponse.ok) {
            const pairData = await pairResponse.json();
            // Get the Base pair with highest liquidity
            const basePair = pairData.pairs
              ?.filter(p => p.chainId === 'base')
              ?.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            return basePair;
          }
        } catch (err) {
          console.warn(`Failed to fetch pair for ${profile.tokenAddress}:`, err);
        }
        return null;
      });
      
      const pairs = (await Promise.all(pairPromises)).filter(Boolean);
      console.log('📍 Pairs fetched:', pairs.length);
      
      // Filter and process pairs
      const tokenMap = new Map();
      
      pairs.forEach(pair => {
        // Skip if missing critical data
        if (!pair.baseToken?.address || !pair.priceUsd || pair.liquidity?.usd < 1000) {
          return;
        }
        
        const address = pair.baseToken.address.toLowerCase();
        
        // If we haven't seen this token, or this pair has better data, use it
        const existingPair = tokenMap.get(address);
        const currentLiquidity = pair.liquidity?.usd || 0;
        const existingLiquidity = existingPair?.liquidity || 0;
        
        if (!existingPair || currentLiquidity > existingLiquidity) {
          tokenMap.set(address, {
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name,
            logo: pair.info?.imageUrl,
            address: pair.baseToken.address,
            price: parseFloat(pair.priceUsd || 0),
            priceChange24h: parseFloat(pair.priceChange?.h24 || 0),
            volume24h: parseFloat(pair.volume?.h24 || 0),
            marketCap: parseFloat(pair.fdv || pair.marketCap || 0),
            liquidity: parseFloat(pair.liquidity?.usd || 0),
            txns24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
            pairAddress: pair.pairAddress,
            dexId: pair.dexId,
          });
        }
      });
      
      // Convert map to array
      const tokenList = Array.from(tokenMap.values());
      
      console.log('📍 Unique tokens found:', tokenList.length);
      console.log('📍 Token list:', tokenList);
      
      // Sort tokens based on selected criteria
      let sortedTokens = [...tokenList];
      switch (sortBy) {
        case 'volume':
          sortedTokens.sort((a, b) => b.volume24h - a.volume24h);
          break;
        case 'price_change':
          sortedTokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
          break;
        case 'market_cap':
          sortedTokens.sort((a, b) => b.marketCap - a.marketCap);
          break;
        default:
          sortedTokens.sort((a, b) => b.volume24h - a.volume24h);
      }
      
      // Limit to specified number
      setTokens(sortedTokens.slice(0, limit));
    } catch (err) {
      console.error('Error fetching trending tokens:', err);
      setError('Failed to load trending tokens');
    } finally {
      setLoading(false);
    }
  }

  // Handle config updates
  const handleToggleTitle = () => {
    const newValue = !showTitle;
    setShowTitle(newValue);
    onUpdateConfig?.({ ...config, showTitle: newValue });
  };

  const handleToggleSubtitle = () => {
    const newValue = !showSubtitle;
    setShowSubtitle(newValue);
    onUpdateConfig?.({ ...config, showSubtitle: newValue });
  };

  const handleToggleImage = () => {
    const newValue = !showImage;
    setShowImage(newValue);
    onUpdateConfig?.({ ...config, showImage: newValue });
  };

  const handleChangeVariant = (newVariant) => {
    setVariant(newVariant);
    onUpdateConfig?.({ ...config, variant: newVariant });
  };

  const handleToggleFixed = () => {
    const newValue = !isFixed;
    setIsFixed(newValue);
    onUpdateConfig?.({ ...config, isFixed: newValue });
  };

  const handleToggleVolume = () => {
    const newValue = !showVolume;
    setShowVolume(newValue);
    onUpdateConfig?.({ ...config, showVolume: newValue });
  };

  const handleToggleMarketCap = () => {
    const newValue = !showMarketCap;
    setShowMarketCap(newValue);
    onUpdateConfig?.({ ...config, showMarketCap: newValue });
  };

  const handleChangeLimit = (newLimit) => {
    setLimit(newLimit);
    onUpdateConfig?.({ ...config, limit: newLimit });
  };

  const handleChangeSortBy = (newSortBy) => {
    setSortBy(newSortBy);
    onUpdateConfig?.({ ...config, sortBy: newSortBy });
  };

  // Format functions
  const formatPrice = (price) => {
    if (!price) return `${currency.symbol}0.00`;
    
    // Use currency context formatting
    if (price < 0.01) {
      return formatCurrencyPrice(price, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
    }
    if (price < 1) {
      return formatCurrencyPrice(price, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
    return formatCurrencyPrice(price, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatLargeNumber = (num) => {
    if (!num) return `${currency.symbol}0`;
    
    // Use currency context formatting with abbreviations
    if (num >= 1e9) {
      return `${currency.symbol}${(num / 1e9).toFixed(2)}B`;
    }
    if (num >= 1e6) {
      return `${currency.symbol}${(num / 1e6).toFixed(2)}M`;
    }
    if (num >= 1e3) {
      return `${currency.symbol}${(num / 1e3).toFixed(2)}K`;
    }
    return formatCurrencyPrice(num, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Custom settings for the card menu
  const customSettings = (
    <div className="space-y-4">
      {/* Display Options */}
      <div>
        <p className="text-white font-medium mb-2">Display Options</p>
        
        <CardSettingsToggle
          title="Show Volume"
          description="Display 24h trading volume"
          isOn={showVolume}
          onToggle={handleToggleVolume}
        />
        
        <CardSettingsToggle
          title="Show Market Cap"
          description="Display market capitalization"
          isOn={showMarketCap}
          onToggle={handleToggleMarketCap}
        />
      </div>

      {/* Number of Tokens */}
      <div>
        <p className="text-white font-medium mb-2">Number of Tokens</p>
        <p className="text-xs text-white/60 mb-3">How many tokens to display</p>
        <select
          value={limit}
          onChange={(e) => handleChangeLimit(Number(e.target.value))}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={15}>Top 15</option>
          <option value={20}>Top 20</option>
        </select>
      </div>

      {/* Sort By */}
      <div>
        <p className="text-white font-medium mb-2">Sort By</p>
        <p className="text-xs text-white/60 mb-3">Ranking criteria</p>
        <select
          value={sortBy}
          onChange={(e) => handleChangeSortBy(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30"
        >
          <option value="volume">24h Volume</option>
          <option value="price_change">24h Price Change</option>
          <option value="market_cap">Market Cap</option>
        </select>
      </div>
    </div>
  );

  return (
    <Card
      title="Trending Base Tokens"
      description="Top performing tokens on Base network"
      showTitle={showTitle}
      showSubtitle={showSubtitle}
      showImage={showImage}
      variant={variant}
      isFixed={isFixed}
      draggable={true}
      onToggleTitle={handleToggleTitle}
      onToggleSubtitle={handleToggleSubtitle}
      onToggleImage={handleToggleImage}
      onChangeVariant={handleChangeVariant}
      onToggleFixed={handleToggleFixed}
      onDelete={onDelete}
      customSettings={customSettings}
      className="h-full flex flex-col"
    >
      <div className="flex-1 flex-wrap overflow-y-auto">
        {loading && tokens.length === 0 ? (
          // Loading skeleton
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-current/5 rounded-lg">
                <div className="w-8 h-8 bg-current/10 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-current/10 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-current/10 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="text-center py-8">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : tokens.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <p className="opacity-60 text-sm">No token data available</p>
          </div>
        ) : (
          // Token list
          <div className="space-y-1.5 flex flex-wrap gap-2">
            {tokens.map((token, index) => (
              <div
                key={token.address}
                className="flex items-center gap-3 p-3 bg-current/5 hover:bg-current/10 rounded-lg transition-colors"
              >
                {/* Position */}
                <div className="w-6 text-center font-bold text-white/40 text-sm">
                  {index + 1}
                </div>

                {/* Logo */}
                <div className="w-8 h-8 flex-shrink-0">
                  {token.logo ? (
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      className="w-full h-full rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full rounded-full bg-current/20 items-center justify-center text-xs font-bold"
                    style={{ display: token.logo ? 'none' : 'flex' }}
                  >
                    {token.symbol[0]}
                  </div>
                </div>

                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">
                    {token.symbol}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {token.name}
                  </div>
                </div>

                {/* Price & Change */}
                <div className="text-right">
                  <div className="font-semibold text-white text-sm">
                    {formatPrice(token.price)}
                  </div>
                  <div className={`text-xs font-medium ${
                    token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {token.priceChange24h >= 0 ? '↑' : '↓'}
                    {Math.abs(token.priceChange24h).toFixed(2)}%
                  </div>
                </div>

                {/* Volume or Market Cap */}
                {(showVolume || showMarketCap) && (
                  <div className="text-right min-w-[70px]">
                    {showVolume && (
                      <div className="text-xs text-white/60">
                        Vol: {formatLargeNumber(token.volume24h)}
                      </div>
                    )}
                    {showMarketCap && (
                      <div className="text-xs text-white/60">
                        MC: {formatLargeNumber(token.marketCap)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last updated indicator */}
      {!loading && tokens.length > 0 && (
        <div className="text-xs text-white/40 text-center mt-3 pt-2 border-t border-white/5">
          Updates every 30 seconds
        </div>
      )}
    </Card>
  );
}

