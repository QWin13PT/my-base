/**
 * PriceTracker Widget - Improved with React Query
 * Displays real-time token price with automatic refresh using React Query
 */

'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/cards/Card';
import { supabase } from '@/lib/supabase';
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';
import CardSettingsTokenSelect from '@/components/cards/CardSettingsTokenSelect';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { useAutoRefreshPrice } from '@/lib/hooks/queries';

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
  const [selectedToken, setSelectedToken] = useState(null);
  
  // Load selected token from config
  useEffect(() => {
    if (config.tokenId) {
      loadToken(config.tokenId);
    }
  }, [config.tokenId]);

  // Use React Query for automatic price fetching and refresh
  const {
    data: priceData,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useAutoRefreshPrice(
    selectedToken?.address,
    30000, // 30 second refresh
    {
      enabled: !!selectedToken?.address && selectedToken?.address !== 'null',
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      onError: (err) => {
        console.error('❌ Error fetching price:', err);
      },
    }
  );

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
    } catch (err) {
      console.error('Error loading token:', err);
    }
  }

  // Handle token selection
  function handleTokenSelect(token) {
    setSelectedToken(token);
    
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

  // Get error message
  const getErrorMessage = () => {
    if (!error) return null;
    
    // API Error handling
    if (error.status === 404) {
      return 'Token not found on CoinGecko';
    }
    if (error.status === 429) {
      return 'Rate limit exceeded. Refreshing soon...';
    }
    if (error.isNetworkError) {
      return 'Network error. Check your connection.';
    }
    
    return error.message || 'Failed to load price';
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

      {/* Manual Refresh Button */}
      {selectedToken && (
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="text-sm text-white/60 hover:text-white/80 transition-colors disabled:opacity-50"
          >
            {loading ? '↻ Refreshing...' : '↻ Refresh Now'}
          </button>
        </div>
      )}
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
            {loading && !priceData ? (
              <div className="animate-pulse">
                <div className="h-12 bg-current/10 rounded w-32 mx-auto mb-4"></div>
              </div>
            ) : isError ? (
              <div className="text-center">
                <p className="text-red-500 text-sm mb-2">{getErrorMessage()}</p>
                <button
                  onClick={() => refetch()}
                  className="text-xs text-white/60 hover:text-white/80 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : priceData ? (
              <>
                <div className="text-3xl font-bold mb-2">
                  {formatPrice(priceData.price)}
                  {loading && <span className="text-sm ml-2 opacity-50">↻</span>}
                </div>
                
                {/* 24h Change */}
                <div className={`text-base font-semibold ${showStats ? 'mb-6' : ''} ${
                  priceData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceData.priceChange24h >= 0 ? '↑' : '↓'} 
                  {Math.abs(priceData.priceChange24h).toFixed(2)}% (24h)
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

