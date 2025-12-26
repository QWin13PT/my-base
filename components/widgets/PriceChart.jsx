'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/cards/Card';
import { supabase } from '@/lib/supabase';
import { getTokenMarketChart } from '@/lib/api/coingecko';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar,
  Cell
} from 'recharts';
import { colors } from '@/lib/theme';
import { motion } from 'motion/react';
import { Spinner } from "@heroui/spinner";
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';
import { HugeiconsIcon } from '@hugeicons/react';
import { WaterfallUp01Icon, ChartAverageIcon } from '@hugeicons-pro/core-solid-standard';

export function PriceChart({
  config = {},
  onUpdateConfig,
  onDelete
}) {
  const [showTitle, setShowTitle] = useState(config.showTitle ?? false);
  const [showSubtitle, setShowSubtitle] = useState(config.showSubtitle ?? false);
  const [showImage, setShowImage] = useState(config.showImage ?? true);
  const [variant, setVariant] = useState(config.variant || 'default');
  const [isFixed, setIsFixed] = useState(config.isFixed || false);
  const [chartColor, setChartColor] = useState(config.chartColor || 'primary');
  const [chartType, setChartType] = useState(config.chartType || 'line');
  const [showPriceInfo, setShowPriceInfo] = useState(config.showPriceInfo ?? true);

  // Token selection state
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);

  // Chart data state
  const [chartData, setChartData] = useState([]);
  const [ohlcvData, setOhlcvData] = useState([]);
  const [timeRange, setTimeRange] = useState(config.timeRange || '7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  // Chart color options from theme
  const chartColorOptions = [
    { name: 'primary', color: colors.primary, label: 'Blue' },
    { name: 'accent', color: colors.accent, label: 'Cyan' },
    { name: 'white', color: '#ffffff', label: 'White' },
    { name: 'black', color: '#000000', label: 'Black' },
  ];

  // Time range options
  const timeRanges = [
    { value: '1', label: '24H' },
    { value: '7', label: '7D' },
    { value: '30', label: '30D' },
    { value: '90', label: '90D' },
    { value: '365', label: '1Y' },
  ];

  // Load selected token from config
  useEffect(() => {
    if (config.tokenId) {
      loadToken(config.tokenId);
    }
  }, [config.tokenId]);

  // Load tokens from database
  async function loadTokens() {
    try {
      let query = supabase
        .from('tokens')
        .select('*')
        .order('widget_count', { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(`symbol.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTokens(data || []);
    } catch (err) {
      console.error('Error loading tokens:', err);
    }
  }

  // Load specific token
  async function loadToken(tokenId) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', tokenId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedToken(data);
        fetchChartData(data);
      }
    } catch (err) {
      console.error('Error loading token:', err);
    }
  }

  // Fetch chart data
  async function fetchChartData(token, customTimeRange) {
    setLoading(true);
    setError(null);

    try {
      const range = customTimeRange || timeRange;
      const response = await getTokenMarketChart(token.address, 'usd', parseInt(range));

      // Extract actual data from cache wrapper
      const chartInfo = response.data || response;

      if (!chartInfo || !chartInfo.prices || chartInfo.prices.length === 0) {
        throw new Error('No chart data available for this token');
      }

      setChartData(chartInfo.prices);

      // Store OHLCV data for candlestick charts
      if (chartInfo.ohlcv && chartInfo.ohlcv.length > 0) {
        setOhlcvData(chartInfo.ohlcv);
      }

      // Calculate price change
      if (chartInfo.prices.length > 1) {
        const firstPrice = chartInfo.prices[0].price;
        const lastPrice = chartInfo.prices[chartInfo.prices.length - 1].price;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;
        setPriceChange(change);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  }

  // Handle token selection
  function handleTokenSelect(token) {
    setSelectedToken(token);
    setShowTokenSelector(false);
    fetchChartData(token);

    // Update config
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        tokenId: token.id,
      });
    }
  }

  // Handle time range change
  function handleTimeRangeChange(newRange) {
    setTimeRange(newRange);
    onUpdateConfig?.({ ...config, timeRange: newRange });
    if (selectedToken) {
      fetchChartData(selectedToken, newRange);
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

  const handleTogglePriceInfo = () => {
    const newValue = !showPriceInfo;
    setShowPriceInfo(newValue);
    onUpdateConfig?.({ ...config, showPriceInfo: newValue });
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

  const handleChangeChartColor = (newColor) => {
    setChartColor(newColor);
    onUpdateConfig?.({ ...config, chartColor: newColor });
  };

  const handleChangeChartType = (newType) => {
    setChartType(newType);
    onUpdateConfig?.({ ...config, chartType: newType });
  };

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return '$0.00';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  // Format date for tooltip
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (timeRange === '1') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Candlestick wick component (thin line from low to high)
  const CandleWick = ({ x, y, width, height, payload }) => {
    if (!payload || payload.low === undefined || payload.high === undefined) return null;
    const isGreen = payload.close >= payload.open;
    const centerX = x + width / 2;
    return (
      <line
        x1={centerX}
        y1={y}
        x2={centerX}
        y2={y + height}
        stroke={isGreen ? '#16a34a' : '#dc2626'}
        strokeWidth={1}
        opacity={0.7}
      />
    );
  };

  // Candlestick body component (thick bar from open to close)
  const CandleBody = ({ x, y, width, height, payload, data }) => {
    if (!data || data.open === undefined || data.close === undefined) return null;
    const isGreen = data.close >= data.open;
    const candleWidth = Math.max(width * 0.6, 2);
    const centerX = x + width / 2 - candleWidth / 2;
    const candleColor = isGreen ? '#16a34a' : '#dc2626';

    return (
      <rect
        x={centerX}
        y={y}
        width={candleWidth}
        height={Math.max(height, 1)}
        fill={isGreen ? candleColor : 'transparent'}
        stroke={candleColor}
        strokeWidth={1}
        opacity={isGreen ? 0.8 : 0.7}
      />
    );
  };

  // Custom tooltip for line chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{formatPrice(payload[0].value)}</p>
          <p className="text-white/60 text-xs">{formatDate(payload[0].payload.timestamp)}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for candlestick chart
  const CandleTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isGreen = data.close >= data.open;
      return (
        <div className="bg-gray-900 border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white/60 text-xs mb-2">{formatDate(data.timestamp)}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-white/60">O:</span>
              <span className="text-white font-semibold">{formatPrice(data.open)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/60">H:</span>
              <span className="text-white font-semibold">{formatPrice(data.high)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/60">L:</span>
              <span className="text-white font-semibold">{formatPrice(data.low)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/60">C:</span>
              <span className={`font-semibold ${isGreen ? 'text-green-500' : 'text-red-500'}`}>
                {formatPrice(data.close)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
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

        {/* Token List */}
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

      {/* Time Range Selector */}
      <div className="border-t border-white/5 pt-4 flex justify-between items-center">
        <div>
          <p className="text-white font-medium">Time Range</p>
          <p className="text-xs text-white/60">Select chart time period</p>
        </div>
        <div className="flex gap-2 bg-white/5 rounded-full p-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleTimeRangeChange(range.value)}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer w-full ${timeRange === range.value
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="border-t border-white/5 pt-4 flex justify-between items-center">
        <div>
          <p className="text-white font-medium">Chart Type</p>
          <p className="text-xs text-white/60">Choose visualization style</p>
        </div>
        <div className="flex gap-2 bg-white/5 rounded-full p-2">
          <button
            onClick={() => handleChangeChartType('line')}
            className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${chartType === 'line'
              ? 'bg-white text-black'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
          >
            <HugeiconsIcon icon={ChartAverageIcon} className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleChangeChartType('candle')}
            className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${chartType === 'candle'
              ? 'bg-white text-black'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
          >
            <HugeiconsIcon icon={WaterfallUp01Icon} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Color Selector */}
      {chartType === 'line' && (
        <div className="border-t border-white/5 pt-4 flex justify-between items-center">
          <div>
            <p className="text-white font-medium">Chart Color</p>
            <p className="text-xs text-white/60">Choose line color</p>
          </div>
          <div className="flex gap-2  p-2">
            {chartColorOptions.map((colorOption) => (
              <button
                key={colorOption.name}
                onClick={() => handleChangeChartColor(colorOption.name)}
                className={`w-10 h-10 rounded-lg cursor-pointer relative transition-all ${chartColor === colorOption.name ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                  }`}
                style={{ backgroundColor: colorOption.color }}
                title={colorOption.label}
              >
                {chartColor === colorOption.name && (
                  <motion.div
                    layoutId="chart-color-indicator"
                    className="absolute inset-0 rounded-lg"
                    transition={{
                      type: "spring",
                      visualDuration: 0.2,
                      bounce: 0.2,
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Info Toggle */}
      <div className="border-t border-white/5 pt-4">
        <CardSettingsToggle
          title="Price Info"
          description="Show current price and change"
          isOn={showPriceInfo}
          onToggle={handleTogglePriceInfo}
        />
      </div>


    </div>
  );

  return (
    <Card
      title={selectedToken ? `Price Chart - ${selectedToken.name}` : 'Price Chart - Loading...'}
      description={selectedToken ? `${selectedToken.symbol} / USD` : 'Token price chart - Loading...'}
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
      <div className="flex-1 flex flex-col">
        {!selectedToken ? (
          // No token selected
          <div className="text-center flex items-center justify-center h-full">
            <div>
              <div className="text-6xl mb-4">📈</div>
              <p className="opacity-60 mb-2">No token selected</p>
              <p className="text-sm opacity-40">
                Click the <span className="opacity-60">⋮</span> menu to select a token
              </p>
            </div>
          </div>
        ) : loading ? (
          // Loading
          <div className="text-center flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : error ? (
          // Error
          <div className="text-center flex items-center justify-center h-full">
            <div>
              <p className="text-red-500 text-sm mb-2">Failed to load chart</p>
              <p className="text-xs opacity-60">{error}</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          // Chart
          <div className="w-full h-full flex flex-col">
            {/* Price Change */}
            {showPriceInfo && priceChange !== null && (
              <div className="mb-4 text-center">
                <div className="text-2xl font-bold mb-1">
                  {formatPrice(chartData[chartData.length - 1].price)}
                </div>
                <div className={`text-sm font-semibold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="w-full" style={{ minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height={300} debounce={50}>
                {chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id={`colorPrice-${chartColor}`} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={chartColorOptions.find(c => c.name === chartColor)?.color}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartColorOptions.find(c => c.name === chartColor)?.color}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      stroke="currentColor"
                      opacity={0.1}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={false}
                      stroke="currentColor"
                      opacity={0.1}
                      tickLine={false}
                      axisLine={false}
                      width={0}
                      domain={['auto', 'auto']}
                    />

                    {/* Horizontal line at current price */}
                    {chartData.length > 0 && (
                      <ReferenceLine
                        y={chartData[chartData.length - 1].price}
                        stroke={chartColorOptions.find(c => c.name === chartColor)?.color}
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                        strokeWidth={1}
                      />
                    )}

                    <Tooltip content={<CustomTooltip />} />

                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={chartColorOptions.find(c => c.name === chartColor)?.color}
                      strokeWidth={2}
                      dot={false}
                      fill={`url(#colorPrice-${chartColor})`}
                      animationDuration={300}
                    />
                  </LineChart>
                ) : (
                  <ComposedChart data={ohlcvData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      stroke="currentColor"
                      opacity={0.1}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={false}
                      stroke="currentColor"
                      opacity={0.1}
                      tickLine={false}
                      axisLine={false}
                      width={0}
                      domain={['auto', 'auto']}
                    />

                    {/* Horizontal line at current price */}
                    {ohlcvData.length > 0 && (() => {
                      const lastCandle = ohlcvData[ohlcvData.length - 1];
                      const isGreen = lastCandle.close >= lastCandle.open;
                      return (
                        <ReferenceLine
                          y={lastCandle.close}
                          stroke={isGreen ? '#16a34a' : '#dc2626'}
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                          strokeWidth={1}
                        />
                      );
                    })()}

                    <Tooltip content={<CandleTooltip />} />

                    {/* Candlestick wicks (high-low range) */}
                    <Bar
                      dataKey={(entry) => [entry.low, entry.high]}
                      fill="transparent"
                      shape={(props) => <CandleWick {...props} />}
                    />

                    {/* Candlestick bodies (open-close range) */}
                    <Bar
                      dataKey={(entry) => [Math.min(entry.open, entry.close), Math.max(entry.open, entry.close)]}
                      shape={(props) => <CandleBody {...props} data={props.payload} />}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default PriceChart;

