'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/cards/Card';
import { supabase } from '@/lib/supabase';
import { getTokenMarketChart } from '@/lib/api/coingecko';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { colors } from '@/lib/theme';
import { motion } from 'motion/react';
import { Spinner } from "@heroui/spinner";
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';
import CardSettingsTokenSelect from '@/components/cards/CardSettingsTokenSelect';
import { useCurrency } from '@/lib/contexts/CurrencyContext';

export function VolumeChart({
  config = {},
  isSettingsOpen = false,
  onToggleSettings,
  onUpdateConfig,
  onDelete
}) {
  const [showTitle, setShowTitle] = useState(config.showTitle ?? false);
  const [showSubtitle, setShowSubtitle] = useState(config.showSubtitle ?? false);
  const [showImage, setShowImage] = useState(config.showImage ?? true);
  const [variant, setVariant] = useState(config.variant || 'default');
  const [isFixed, setIsFixed] = useState(config.isFixed || false);
  const [chartColor, setChartColor] = useState(config.chartColor || 'primary');
  const [showVolumeInfo, setShowVolumeInfo] = useState(config.showVolumeInfo ?? true);

  // Use currency context
  const { currency, formatPrice: formatCurrencyPrice } = useCurrency();

  // Token selection state
  const [selectedToken, setSelectedToken] = useState(null);

  // Chart data state
  const [volumeData, setVolumeData] = useState([]);
  const [timeRange, setTimeRange] = useState(config.timeRange || '7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [volumeStats, setVolumeStats] = useState(null);

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
        fetchVolumeData(data);
      }
    } catch (err) {
      console.error('Error loading token:', err);
    }
  }

  // Fetch volume data
  async function fetchVolumeData(token, customTimeRange) {
    setLoading(true);
    setError(null);

    try {
      const range = customTimeRange || timeRange;
      const response = await getTokenMarketChart(token.address, 'usd', parseInt(range));

      // Extract actual data from cache wrapper
      const chartInfo = response.data || response;

      if (!chartInfo || !chartInfo.ohlcv || chartInfo.ohlcv.length === 0) {
        throw new Error('No volume data available for this token');
      }

      // Reverse the data to ensure chronological order (oldest to newest)
      const reversedData = [...chartInfo.ohlcv].reverse();

      // Transform data for bar chart
      const volumeChartData = reversedData.map((item) => ({
        timestamp: item.timestamp,
        date: new Date(item.timestamp),
        volume: item.volume,
        // Determine if price went up or down (for coloring bars)
        priceChange: item.close - item.open,
      }));

      setVolumeData(volumeChartData);

      // Calculate volume statistics
      if (volumeChartData.length > 0) {
        const totalVolume = volumeChartData.reduce((sum, item) => sum + item.volume, 0);
        const avgVolume = totalVolume / volumeChartData.length;
        const maxVolume = Math.max(...volumeChartData.map(item => item.volume));
        const latestVolume = volumeChartData[volumeChartData.length - 1]?.volume || 0;

        setVolumeStats({
          total: totalVolume,
          average: avgVolume,
          max: maxVolume,
          latest: latestVolume,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch volume data');
    } finally {
      setLoading(false);
    }
  }

  // Handle token selection
  function handleTokenSelect(token) {
    setSelectedToken(token);
    fetchVolumeData(token);

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
      fetchVolumeData(selectedToken, newRange);
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

  const handleToggleVolumeInfo = () => {
    const newValue = !showVolumeInfo;
    setShowVolumeInfo(newValue);
    onUpdateConfig?.({ ...config, showVolumeInfo: newValue });
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

  // Format volume for display
  const formatVolume = (volume) => {
    if (!volume) return `${currency.symbol}0`;
    
    if (volume >= 1e9) {
      return `${currency.symbol}${(volume / 1e9).toFixed(2)}B`;
    }
    if (volume >= 1e6) {
      return `${currency.symbol}${(volume / 1e6).toFixed(2)}M`;
    }
    if (volume >= 1e3) {
      return `${currency.symbol}${(volume / 1e3).toFixed(2)}K`;
    }
    return formatCurrencyPrice(volume, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format date for tooltip
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (timeRange === '1') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{formatVolume(data.volume)}</p>
          <p className="text-white/60 text-xs">{formatDate(data.timestamp)}</p>
        </div>
      );
    }
    return null;
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

      {/* Chart Color Selector */}
      <div className="border-t border-white/5 pt-4 flex justify-between items-center">
        <div>
          <p className="text-white font-medium">Chart Color</p>
          <p className="text-xs text-white/60">Choose bar color</p>
        </div>
        <div className="flex gap-2 p-2">
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
                  layoutId="volume-color-indicator"
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

      {/* Volume Info Toggle */}
      <div className="border-t border-white/5 pt-4">
        <CardSettingsToggle
          title="Volume Info"
          description="Show volume statistics"
          isOn={showVolumeInfo}
          onToggle={handleToggleVolumeInfo}
        />
      </div>
    </div>
  );

  return (
    <Card
      title={selectedToken ? `Volume Chart - ${selectedToken.name}` : 'Volume Chart - Loading...'}
      description={`Last ${timeRange}${timeRange === '1' ? ' day' : timeRange === '365' ? ' days' : timeRange === '30' ? ' days' : timeRange === 'max' ? ' (max)' : ' days'}`}
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
      <div className="flex-1 flex flex-col">
        {!selectedToken ? (
          // No token selected
          <div className="text-center flex items-center justify-center h-full">
            <div>
              <div className="text-6xl mb-4">📊</div>
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
              <p className="text-red-500 text-sm mb-2">Failed to load volume data</p>
              <p className="text-xs opacity-60">{error}</p>
            </div>
          </div>
        ) : volumeData.length > 0 ? (
          // Chart
          <div className="w-full h-full flex flex-col">
            {/* Volume Stats */}
            {showVolumeInfo && volumeStats && (
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="bg-current/5 rounded-lg p-3">
                  <p className="text-xs opacity-60 mb-1">Latest Volume</p>
                  <p className="text-sm font-bold">{formatVolume(volumeStats.latest)}</p>
                </div>
                <div className="bg-current/5 rounded-lg p-3">
                  <p className="text-xs opacity-60 mb-1">Average Volume</p>
                  <p className="text-sm font-bold">{formatVolume(volumeStats.average)}</p>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="w-full flex-1 [&_svg]:outline-none [&_*]:outline-none">
              <ResponsiveContainer width="100%" height="100%" minHeight={200} debounce={50}>
                <BarChart data={volumeData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="volume"
                    radius={[4, 4, 0, 0]}
                  >
                    {volumeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColorOptions.find(c => c.name === chartColor)?.color}
                        opacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default VolumeChart;

