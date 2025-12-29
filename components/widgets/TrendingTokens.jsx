'use client';

import { useState, useEffect, useRef } from 'react';
import Card from '@/components/cards/Card';
import { BASE_TOKENS, getAllTokenAddresses } from '@/config/base-tokens';
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';
import CardSettingsDropdown from '@/components/cards/CardSettingsDropdown';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons-pro/core-stroke-standard';

export default function TrendingTokens({ 
  config = {}, 
  isSettingsOpen = false,
  onToggleSettings,
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
  const [showLiquidity, setShowLiquidity] = useState(config.showLiquidity ?? false);
  const [limit, setLimit] = useState(config.limit || 10);
  const [sortBy, setSortBy] = useState(config.sortBy || 'volume'); // volume, priceChange, txns, gainers, losers, volatility, liquidity
  
  // Use currency context
  const { currency, formatPrice: formatCurrencyPrice } = useCurrency();
  
  // Text color based on variant (white variant uses black text)
  const isLightVariant = variant === 'white';
  const textPrimary = isLightVariant ? 'text-black' : 'text-white';
  const textSecondary = isLightVariant ? 'text-black/60' : 'text-white/60';
  const textTertiary = isLightVariant ? 'text-black/40' : 'text-white/40';
  const textMuted = isLightVariant ? 'text-black/50' : 'text-white/50';
  const bgHover = isLightVariant ? 'bg-black/5 hover:bg-black/10' : 'bg-current/5 hover:bg-current/10';
  
  // Data state
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Scroll state
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  
  // Check scroll position and update button visibility
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };
  
  // Update scroll buttons when tokens change or on mount
  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tokens]);
  
  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  async function fetchTrendingTokens() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📍 Fetching truly trending Base tokens from DexScreener...');
      
      // Call our DexScreener API route for dynamic trending data
      const response = await fetch(`/api/dexscreener/trending?limit=${limit}&sortBy=${sortBy}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log(`📍 Received ${data.tokens?.length || 0} trending tokens`);
      
      if (!data.tokens || data.tokens.length === 0) {
        setTokens([]);
        setError('No trending tokens found at the moment. Try refreshing.');
        return;
      }
      
      // Data is already sorted by the API based on sortBy parameter
      setTokens(data.tokens);
      
      console.log('📍 Final token list:', data.tokens);
    } catch (err) {
      console.error('Error fetching trending tokens:', err);
      setError('Failed to load trending token data');
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

  const handleToggleLiquidity = () => {
    const newValue = !showLiquidity;
    setShowLiquidity(newValue);
    onUpdateConfig?.({ ...config, showLiquidity: newValue });
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
      <div className="flex flex-col gap-4">
        <p className="text-white/60 font-medium -mb-2 text-sm uppercase">Display Options</p>
        
        <CardSettingsToggle
          title="Show Volume"
          description="Display 24h trading volume"
          isOn={showVolume}
          onToggle={handleToggleVolume}
  
        />
        
        <CardSettingsToggle
          title="Show Liquidity"
          description="Display liquidity pool size"
          isOn={showLiquidity}
          onToggle={handleToggleLiquidity}
  
        />
      </div>

      {/* Number of Tokens */}
      <CardSettingsDropdown
        title="Number of Tokens"
        description="How many tokens to display"
        value={limit}
        onChange={(value) => handleChangeLimit(Number(value))}
        options={[
          { value: 5, label: 'Top 5' },
          { value: 10, label: 'Top 10' },
          { value: 15, label: 'Top 15' },
          { value: 20, label: 'Top 20' },
        ]}
      />

      {/* Sort By */}
      <CardSettingsDropdown
        title="Sort By"
        description="Trending criteria"
        value={sortBy}
        onChange={handleChangeSortBy}
        options={[
          { value: 'volume', label: '🔥 Highest Volume' },
          { value: 'txns', label: '⚡ Most Transactions' },
          { value: 'gainers', label: '📈 Biggest Gainers' },
          { value: 'losers', label: '📉 Biggest Losers' },
          { value: 'volatility', label: '💥 Most Volatile' },
          { value: 'liquidity', label: '💧 Highest Liquidity' },
        ]}
      />
    </div>
  );

  return (
    <Card
      title="Trending Base Tokens"
      description="Real-time trending tokens on Base network"
      showTitle={showTitle}
      showSubtitle={showSubtitle}
      showImage={showImage}
      variant={variant}
      isFixed={isFixed}
      draggable={true}
      isSettingsOpen={isSettingsOpen}
      onToggleSettings={onToggleSettings}
      onToggleTitle={handleToggleTitle}
      onToggleSubtitle={handleToggleSubtitle}
      onToggleImage={handleToggleImage}
      onChangeVariant={handleChangeVariant}
      onToggleFixed={handleToggleFixed}
      onDelete={onDelete}
      customSettings={customSettings}
      className="h-full flex flex-col"
    >
      <div className="flex-1 min-h-0 relative">
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
            <p className={`text-sm ${isLightVariant ? 'text-red-600' : 'text-red-500'}`}>{error}</p>
          </div>
        ) : tokens.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <p className={`text-sm ${textSecondary}`}>No token data available</p>
          </div>
        ) : (
          // Token list with horizontal scroll
          <>
            <div 
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
            {tokens.map((token, index) => (
              <div
                key={token.address}
                className={`flex items-center gap-3 p-3 ${bgHover} rounded-lg transition-colors  ${(!showVolume && !showLiquidity) && ('max-w-[250px]')}`}
              >
                {/* Position */}
                <div className={`w-6 text-center font-bold ${textTertiary} text-sm`}>
                  #{index + 1}
                </div>

                {/* Logo */}
                <div className="w-8 h-8 shrink-0">
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
                    className={`w-full h-full rounded-full items-center justify-center text-xs font-bold ${isLightVariant ? 'bg-black/10 text-black' : 'bg-current/20 text-white'}`}
                    style={{ display: token.logo ? 'none' : 'flex' }}
                  >
                    {token.symbol[0]}
                  </div>
                </div>

                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${textPrimary} text-sm truncate`}>
                    {token.symbol}
                  </div>
                  <div className={`text-xs ${textMuted} truncate`}>
                    {token.name}
                  </div>
                </div>

                {/* Price & Change */}
                <div className="text-right">
                  <div className={`font-semibold ${textPrimary} text-sm`}>
                    {formatPrice(token.price)}
                  </div>
                  <div className={`text-xs font-medium ${
                    token.priceChange24h >= 0 
                      ? (isLightVariant ? 'text-green-600' : 'text-green-500')
                      : (isLightVariant ? 'text-red-600' : 'text-red-500')
                  }`}>
                    {token.priceChange24h >= 0 ? '↑' : '↓'}
                    {Math.abs(token.priceChange24h).toFixed(2)}%
                  </div>
                </div>

                {/* Volume & Liquidity Info */}
                {(showVolume || showLiquidity) && (
                  <div className="text-right min-w-[80px]">
                    {showVolume && token.volume24h > 0 && (
                      <div className={`text-xs ${textSecondary}`}>
                        Vol: {formatLargeNumber(token.volume24h)}
                      </div>
                    )}
                    {showLiquidity && token.liquidity > 0 && (
                      <div className={`text-xs ${textMuted}`}>
                        Liq: {formatLargeNumber(token.liquidity)}
                      </div>
                    )}
                  </div>
                )}
              </div>
             ))}
            </div>
            
            {/* Scroll Buttons */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg transition-all cursor-pointer backdrop-blur-sm ${
                  isLightVariant 
                    ? 'bg-white hover:bg-gray-100 text-black border border-gray-200' 
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10'
                }`}
                aria-label="Scroll left"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
              </button>
            )}
            
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg transition-all cursor-pointer backdrop-blur-sm ${
                  isLightVariant 
                    ? 'bg-white hover:bg-gray-100 text-black border border-gray-200' 
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10'
                }`}
                aria-label="Scroll right"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
              </button>
            )}
          </>
         )}
       </div>

    
    </Card>
  );
}

