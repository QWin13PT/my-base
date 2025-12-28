'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/cards/Card';
import { supabase } from '@/lib/supabase';
import { getTokenPrice } from '@/lib/api/coingecko';
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';
import CardSettingsTokenSelect from '@/components/cards/CardSettingsTokenSelect';
import { useCurrency } from '@/lib/contexts/CurrencyContext';

export default function PriceTracker({ 
  config = {}, 
  isSettingsOpen = false,
  onToggleSettings,
  onUpdateConfig,
  onDelete 
}) {
  const [showTitle, setShowTitle] = useState(config.showTitle ?? false);
  const [showSubtitle, setShowSubtitle] = useState(config.showSubtitle ?? false);
  const [showImage, setShowImage] = useState(config.showImage ?? true);
  const [showStats, setShowStats] = useState(config.showStats ?? true);
  const [variant, setVariant] = useState(config.variant || 'default');
  const [isFixed, setIsFixed] = useState(config.isFixed || false);
  
  // Use currency context
  const { currency, formatPrice: formatCurrencyPrice } = useCurrency();
  
  // Token selection state
  const [selectedToken, setSelectedToken] = useState(config.tokenId ? null : null);
  
  // Price data state
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load selected token from config
  useEffect(() => {
    if (config.tokenId) {
      loadToken(config.tokenId);
    }
  }, [config.tokenId]);

  // Auto-refresh price every 30 seconds
  useEffect(() => {
    if (!selectedToken) return;
    
    const interval = setInterval(() => {
      fetchPrice(selectedToken);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedToken]);

  // Load token from database
  async function loadToken(tokenId) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', tokenId)
        .single();
      
      if (error) throw error;
      setSelectedToken(data);
      
      // Fetch live price
      if (data) {
        fetchPrice(data);
      }
    } catch (err) {
      console.error('Error loading token:', err);
    }
  }

  // Fetch live price from CoinGecko API
  async function fetchPrice(token) {
    setLoading(true);
    setError(null);
    
    try {
      if (!token.address || token.address === 'null' || token.address === '') {
        throw new Error('Token address not available');
      }
      
      // Call CoinGecko API with the token address
      const data = await getTokenPrice(token.address);
      
      // Extract the actual data (API returns { data: {...}, cached: bool })
      const priceInfo = data.data || data;
      
      if (!priceInfo || typeof priceInfo.price === 'undefined' || priceInfo.price === 0) {
        console.log('❌ Price check failed - priceInfo:', priceInfo);
        throw new Error('Price data not available for this token. It may not be listed on CoinGecko yet.');
      }
      
      // Set the price data
      setPriceData({
        price: priceInfo.price,
        change24h: priceInfo.priceChange24h || 0,
        volume24h: priceInfo.volume24h || 0,
        marketCap: priceInfo.marketCap || 0,
      });
    } catch (err) {
      console.error('❌ Error fetching price:', err);
      
      // More descriptive error messages
      let errorMessage = 'Failed to fetch price data';
      if (err.message.includes('404')) {
        errorMessage = 'Token not found on CoinGecko';
      } else if (err.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (err.message.includes('Token address not available')) {
        errorMessage = 'Invalid token address';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Handle token selection
  function handleTokenSelect(token) {
    setSelectedToken(token);
    setShowTokenSelector(false);
    fetchPrice(token);
    
    // Update config
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        tokenId: token.id,
      });
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

  const handleToggleStats = () => {
    const newValue = !showStats;
    setShowStats(newValue);
    onUpdateConfig?.({ ...config, showStats: newValue });
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

  // Format price
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

  // Format large numbers
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
      {/* Token Selector */}
      <CardSettingsTokenSelect
        selectedToken={selectedToken}
        onTokenSelect={handleTokenSelect}
        title="Selected Token"
        description="Choose which token to track"
      />

      {/* Stats Visibility Toggle */}
      <CardSettingsToggle
        title="Market Stats"
        description="Display market cap and volume"
        isOn={showStats}
        onToggle={handleToggleStats}
      />
    </div>
  );

  return (
    <Card
      title={selectedToken ? selectedToken.symbol : 'Price Tracker'}
      description={selectedToken ? selectedToken.name : 'Real-time token prices'}
      image={selectedToken ? selectedToken.logo_url : null}
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
      <div className="flex-1 flex flex-col items-center justify-center pt-2">
        {!selectedToken ? (
          // No token selected - Direct user to settings
          <div className="text-center">
            <div className="text-6xl mb-4">💰</div>
            <p className="opacity-60 mb-2">No token selected</p>
            <p className="text-sm opacity-40">
              Click the <span className="opacity-60">⋮</span> menu to select a token
            </p>
          </div>
        ) : (
          // Token selected - Show price data
          <div className="w-full">
           
            {/* Price */}
            {loading ? (
              <div className="animate-pulse">
                <div className="h-12 bg-current/10 rounded w-32 mx-auto mb-4"></div>
              </div>
            ) : error ? (
              <p className="text-red-500 text-sm">Failed to load price</p>
            ) : priceData ? (
              <>
                <div className="text-3xl font-bold mb-2">
                  {formatPrice(priceData.price)}
                </div>
                
                {/* 24h Change */}
                <div className={`text-base font-semibold ${showStats ? 'mb-6' : ''} ${
                  priceData.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceData.change24h >= 0 ? '↑' : '↓'} 
                  {Math.abs(priceData.change24h).toFixed(2)}% (24h)
                </div>
                
                {/* Stats */}
                {showStats && (
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-current/5 rounded-lg p-3">
                      <p className="text-xs opacity-60 mb-1">Market Cap</p>
                      <p className="text-sm font-semibold">
                        {formatLargeNumber(priceData.marketCap)}
                      </p>
                    </div>
                    <div className="bg-current/5 rounded-lg p-3">
                      <p className="text-xs opacity-60 mb-1">24h Volume</p>
                      <p className="text-sm font-semibold">
                        {formatLargeNumber(priceData.volume24h)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}

