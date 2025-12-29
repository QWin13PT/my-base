'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/cards/Card';
import { useWallet } from '@/lib/hooks/useWallet';
import { getTokenBalance } from '@/lib/api/basescan';
import { getBaseTokensPrices } from '@/lib/api/coingecko';
import { BASE_TOKENS } from '@/config/base-tokens';
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Top Base tokens to check for portfolio
const PORTFOLIO_TOKENS = [
  { symbol: 'ETH', address: 'native', name: 'Ethereum' },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', name: 'USD Coin' },
  { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', name: 'Wrapped Ether' },
  { symbol: 'USDbC', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', name: 'USD Base Coin' },
  { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', name: 'Dai Stablecoin' },
  { symbol: 'cbBTC', address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', name: 'Coinbase Wrapped BTC' },
  { symbol: 'AERO', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', name: 'Aerodrome' },
  { symbol: 'DEGEN', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', name: 'Degen' },
  { symbol: 'BRETT', address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', name: 'Brett' },
  { symbol: 'TOSHI', address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4', name: 'Toshi' },
];

// Color palette for pie chart
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export default function PortfolioTracker({ 
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
  const [showLegend, setShowLegend] = useState(config.showLegend ?? true);
  const [showValues, setShowValues] = useState(config.showValues ?? true);
  const [minDisplayValue, setMinDisplayValue] = useState(config.minDisplayValue || 1); // Minimum USD value to display
  
  // Use wallet and currency context
  const { address, isConnected } = useWallet();
  const { currency, formatPrice: formatCurrencyPrice } = useCurrency();
  
  // Data state
  const [portfolio, setPortfolio] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch portfolio data when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchPortfolio();
      
      // Auto-refresh every 60 seconds
      const interval = setInterval(() => {
        fetchPortfolio();
      }, 60000);
      
      return () => clearInterval(interval);
    } else {
      setPortfolio([]);
      setTotalValue(0);
    }
  }, [address, isConnected, minDisplayValue]);

  async function fetchPortfolio() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Fetching portfolio for:', address);
      
      // Get balances for all tracked tokens
      const balancePromises = PORTFOLIO_TOKENS.map(async (token) => {
        try {
          if (token.address === 'native') {
            // For native ETH, use web3 or skip (handled by wagmi useBalance)
            return null;
          }
          
          // Fetch token balance
          const balanceData = await getTokenBalance(address, token.address);
          
          // Convert balance from wei to decimal (assuming 18 decimals for most tokens)
          const balanceRaw = balanceData?.balance || '0';
          const balanceFormatted = parseFloat(balanceRaw) / 1e18;
          
          return {
            ...token,
            balance: balanceRaw,
            balanceFormatted,
          };
        } catch (err) {
          console.warn(`Failed to fetch balance for ${token.symbol}:`, err);
          return null;
        }
      });
      
      const balances = (await Promise.all(balancePromises)).filter(Boolean);
      
      // Get prices for tokens with non-zero balance
      const tokenAddresses = balances
        .filter(b => parseFloat(b.balanceFormatted) > 0)
        .map(b => b.address);
      
      if (tokenAddresses.length === 0) {
        setPortfolio([]);
        setTotalValue(0);
        setLoading(false);
        return;
      }
      
      // Fetch prices
      const prices = await getBaseTokensPrices(tokenAddresses);
      console.log('📊 Prices fetched:', prices);
      
      // Calculate portfolio values
      const portfolioItems = balances
        .map(token => {
          const price = prices.data?.[token.address.toLowerCase()]?.usd || 0;
          const value = parseFloat(token.balanceFormatted) * price;
          
          return {
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            balance: parseFloat(token.balanceFormatted),
            price,
            value,
          };
        })
        .filter(item => item.value >= minDisplayValue) // Filter by minimum value
        .sort((a, b) => b.value - a.value); // Sort by value descending
      
      const total = portfolioItems.reduce((sum, item) => sum + item.value, 0);
      
      // Add percentage to each item
      const portfolioWithPercentage = portfolioItems.map(item => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0,
      }));
      
      console.log('📊 Portfolio calculated:', portfolioWithPercentage);
      
      setPortfolio(portfolioWithPercentage);
      setTotalValue(total);
    } catch (err) {
      console.error('❌ Error fetching portfolio:', err);
      setError('Failed to load portfolio data');
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

  const handleToggleLegend = () => {
    const newValue = !showLegend;
    setShowLegend(newValue);
    onUpdateConfig?.({ ...config, showLegend: newValue });
  };

  const handleToggleValues = () => {
    const newValue = !showValues;
    setShowValues(newValue);
    onUpdateConfig?.({ ...config, showValues: newValue });
  };

  const handleChangeMinValue = (newMin) => {
    setMinDisplayValue(newMin);
    onUpdateConfig?.({ ...config, minDisplayValue: newMin });
  };

  // Format functions
  const formatPrice = (price) => {
    if (!price) return `${currency.symbol}0.00`;
    
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
    
    if (num >= 1e6) {
      return `${currency.symbol}${(num / 1e6).toFixed(2)}M`;
    }
    if (num >= 1e3) {
      return `${currency.symbol}${(num / 1e3).toFixed(2)}K`;
    }
    return formatCurrencyPrice(num, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{data.symbol}</p>
          <p className="text-white/80 text-sm">{data.name}</p>
          <p className="text-white font-bold mt-2">{formatLargeNumber(data.value)}</p>
          <p className="text-white/60 text-xs">{data.percentage.toFixed(2)}% of portfolio</p>
          <p className="text-white/60 text-xs mt-1">
            {data.balance.toFixed(4)} {data.symbol}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom settings for the card menu
  const customSettings = (
    <div className="space-y-4">
      {/* Display Options */}
      <div>
        <p className="text-white font-medium mb-2">Display Options</p>
        
        <CardSettingsToggle
          title="Show Legend"
          description="Display token legend below chart"
          isOn={showLegend}
          onToggle={handleToggleLegend}
        />
        
        <CardSettingsToggle
          title="Show Values"
          description="Display USD values in list"
          isOn={showValues}
          onToggle={handleToggleValues}
        />
      </div>

      {/* Minimum Display Value */}
      <div>
        <p className="text-white font-medium mb-2">Minimum Value</p>
        <p className="text-xs text-white/60 mb-3">Hide tokens below this USD value</p>
        <select
          value={minDisplayValue}
          onChange={(e) => handleChangeMinValue(Number(e.target.value))}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30"
        >
          <option value={0.01}>$0.01+</option>
          <option value={0.1}>$0.10+</option>
          <option value={1}>$1+</option>
          <option value={10}>$10+</option>
          <option value={100}>$100+</option>
        </select>
      </div>

      {/* Refresh Button */}
      <button
        onClick={() => fetchPortfolio()}
        disabled={!isConnected || loading}
        className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
      >
        {loading ? 'Refreshing...' : 'Refresh Portfolio'}
      </button>
    </div>
  );

  return (
    <Card
      title="Portfolio Tracker"
      description={isConnected ? `Total: ${formatLargeNumber(totalValue)}` : 'Connect wallet to view'}
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
      <div className="flex-1 flex flex-col">
        {!isConnected ? (
          // Not connected - Show prompt
          <div className="flex-1 flex items-center justify-center text-center py-8">
            <div>
              <div className="text-6xl mb-4">👛</div>
              <p className="opacity-60 mb-2">Connect your wallet</p>
              <p className="text-sm opacity-40">
                to view your portfolio
              </p>
            </div>
          </div>
        ) : loading && portfolio.length === 0 ? (
          // Loading skeleton
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-center">
              <div className="w-32 h-32 bg-current/10 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-current/10 rounded w-32 mx-auto"></div>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="flex-1 flex items-center justify-center text-center py-8">
            <div>
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
        ) : portfolio.length === 0 ? (
          // Empty portfolio
          <div className="flex-1 flex items-center justify-center text-center py-8">
            <div>
              <div className="text-5xl mb-4">📊</div>
              <p className="opacity-60 mb-2">No tokens found</p>
              <p className="text-sm opacity-40">
                Your wallet doesn't have any tracked tokens
              </p>
            </div>
          </div>
        ) : (
          // Portfolio data
          <div className="flex-1 flex flex-col gap-4">
            {/* Pie Chart */}
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolio}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                    cornerRadius={8}
                  >
                    {portfolio.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {portfolio.map((token, index) => (
                  <div
                    key={token.address}
                    className="flex items-center gap-3 p-3 bg-current/5 hover:bg-current/10 rounded-lg transition-colors"
                  >
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {token.symbol}
                      </div>
                      <div className="text-xs opacity-60 truncate">
                        {token.balance.toFixed(4)} {token.symbol}
                      </div>
                    </div>

                    {/* Value & Percentage */}
                    <div className="text-right">
                      {showValues && (
                        <div className="font-semibold text-sm">
                          {formatLargeNumber(token.value)}
                        </div>
                      )}
                      <div className="text-xs opacity-60">
                        {token.percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Value */}
            <div className="border-t border-current/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Value</span>
                <span className="font-bold text-lg">
                  {formatLargeNumber(totalValue)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Last updated indicator */}
      {!loading && portfolio.length > 0 && (
        <div className="text-xs text-current/40 text-center mt-3 pt-2 border-t border-current/5">
          Updates every 60 seconds
        </div>
      )}
    </Card>
  );
}

