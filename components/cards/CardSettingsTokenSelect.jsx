'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons-pro/core-solid-standard';

export default function CardSettingsTokenSelect({ 
  selectedToken, 
  onTokenSelect,
  title = "Selected Token",
  description = "Choose which token to track"
}) {
  const [tokens, setTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load tokens when search query changes
  useEffect(() => {
    if (showTokenSelector) {
      loadTokens();
    }
  }, [searchQuery, showTokenSelector]);

  // Fetch tokens for selector
  async function loadTokens() {
    setLoading(true);
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
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }

  // Handle token selection
  function handleTokenSelect(token) {
    setShowTokenSelector(false);
    setSearchQuery('');
    onTokenSelect?.(token);
  }

  return (
    <div>
      <p className="text-white font-medium">{title}</p>
      <p className="text-xs text-white/60 mb-3">{description}</p>
      
      {/* Current Selection */}
      {selectedToken && (
        <div className="mb-3 p-3 bg-white/5 rounded-xl flex items-center gap-3">
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
      <div className="relative mb-2">
        <HugeiconsIcon 
          icon={Search01Icon} 
          className="w-4 h-4 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" 
        />
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!showTokenSelector) {
              setShowTokenSelector(true);
            }
          }}
          onFocus={() => setShowTokenSelector(true)}
          onBlur={() => {
            // Delay hiding to allow clicking on tokens
            setTimeout(() => setShowTokenSelector(false), 200);
          }}
          className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/30"
        />
      </div>
      
      {/* Token List (shown when searching) */}
      {showTokenSelector && (
        <div className="max-h-48 overflow-y-auto space-y-1 bg-white/5 rounded-xl p-2">
          {loading ? (
            <p className="text-center text-white/60 py-4 text-sm">
              Loading tokens...
            </p>
          ) : tokens.length === 0 ? (
            <p className="text-center text-white/60 py-4 text-sm">
              No tokens found
            </p>
          ) : (
            tokens.map((token) => (
              <button
                key={token.id}
                onMouseDown={() => handleTokenSelect(token)}
                className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors text-left cursor-pointer"
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
  );
}