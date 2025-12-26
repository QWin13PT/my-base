'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/cards/Card';
import { supabase } from '@/lib/supabase';
import { getTokenPrice } from '@/lib/api/coingecko';
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';

export default function PriceTracker({ 
  config = {}, 
  onUpdateConfig,
  onDelete 
}) {
  const [showTitle, setShowTitle] = useState(config.showTitle ?? false);
  const [showSubtitle, setShowSubtitle] = useState(config.showSubtitle ?? false);
  const [showImage, setShowImage] = useState(config.showImage ?? true);
  const [showStats, setShowStats] = useState(config.showStats ?? true);
  const [variant, setVariant] = useState(config.variant || 'default');
  const [isFixed, setIsFixed] = useState(config.isFixed || false);
  
  // Token selection state
  const [selectedToken, setSelectedToken] = useState(config.tokenId ? null : null);
  const [tokens, setTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  
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

  // Fetch tokens for selector
  async function loadTokens() {
    try {
      let query = supabase
        .from('tokens')
        .select('id, address, symbol, name, logo_url, category, verified')
        .order('verified', { ascending: false })
        .order('symbol', { ascending: true });
      
      if (searchQuery) {
        query = query.or(`symbol.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      setTokens(data || []);
    } catch (err) {
      console.error('Error loading tokens:', err);
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
    if (!price) return '$0.00';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  // Format large numbers
  const formatLargeNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Custom settings for the card menu
  const customSettings = (
    <div className="space-y-4">
      {/* Token Selector */}
      <div>
        <p className="text-white font-medium mb-2">Selected Token</p>
        <p className="text-xs text-white/60 mb-3">Choose which token to track</p>
        
        {/* Current Selection */}
        {selectedToken && (
          <div className="mb-3 p-3 bg-white/5 rounded-lg flex items-center gap-3">
            {selectedToken.logo_url ? (
              <img 
                src={selectedToken.logo_url} 
                alt={selectedToken.symbol}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                {selectedToken.symbol[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">
                {selectedToken.symbol}
              </div>
              <div className="text-xs text-white/60">
                {selectedToken.name}
              </div>
            </div>
          </div>
        )}
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!showTokenSelector) {
              setShowTokenSelector(true);
              loadTokens();
            }
          }}
          onFocus={() => {
            setShowTokenSelector(true);
            loadTokens();
          }}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/30 mb-2"
        />
        
        {/* Token List (shown when searching) */}
        {showTokenSelector && (
          <div className="max-h-48 overflow-y-auto space-y-1 bg-white/5 rounded-lg p-2">
            {tokens.length === 0 ? (
              <p className="text-center text-white/60 py-4 text-sm">
                No tokens found
              </p>
            ) : (
              tokens.map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded transition-colors text-left"
                >
                  {token.logo_url ? (
                    <img 
                      src={token.logo_url} 
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                      {token.symbol[0]}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-white text-xs truncate">
                        {token.symbol}
                      </span>
                      {token.verified && (
                        <span className="text-xs text-blue-400">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 truncate">
                      {token.name}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

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

