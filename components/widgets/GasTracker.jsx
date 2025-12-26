'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/cards/Card';
import { getGasPrices } from '@/lib/api/basescan';
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { colors } from '@/lib/theme';
import { motion } from 'motion/react';
import { Spinner } from "@heroui/spinner";
import { HugeiconsIcon } from '@hugeicons/react';
import { Activity02Icon } from '@hugeicons-pro/core-solid-standard';
import { useCurrency } from '@/lib/contexts/CurrencyContext';

export default function GasTracker({
  config = {},
  onUpdateConfig,
  onDelete
}) {
  const [showTitle, setShowTitle] = useState(config.showTitle ?? true);
  const [showSubtitle, setShowSubtitle] = useState(config.showSubtitle ?? true);
  const [showImage, setShowImage] = useState(config.showImage ?? true);
  const [variant, setVariant] = useState(config.variant || 'default');
  const [isFixed, setIsFixed] = useState(config.isFixed || false);
  const [showChart, setShowChart] = useState(config.showChart ?? true);

  // Use currency context
  const { currency, formatPrice: formatCurrencyPrice } = useCurrency();

  // Gas data state
  const [gasData, setGasData] = useState(null);
  const [historicalData, setHistoricalData] = useState(() => {
    // Load historical data from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('gasTracker_historical');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Keep only data from last 24 hours
          const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
          return parsed.filter(item => item.timestamp > oneDayAgo);
        }
      } catch (err) {
        console.error('Error loading historical gas data:', err);
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Load gas prices on mount and set up auto-refresh
  useEffect(() => {
    fetchGasData();
    
    // Refresh every 15 seconds
    const interval = setInterval(() => {
      fetchGasData();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  // Save historical data to localStorage whenever it changes
  useEffect(() => {
    if (historicalData.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem('gasTracker_historical', JSON.stringify(historicalData));
      } catch (err) {
        console.error('Error saving historical gas data:', err);
      }
    }
  }, [historicalData]);

  // Fetch current gas prices
  async function fetchGasData() {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getGasPrices();
      
      if (!data || !data.data) {
        throw new Error('Failed to fetch gas prices');
      }

      const gasInfo = data.data;
      setGasData(gasInfo);
      
      // Add to historical data (keep last 100 data points)
      setHistoricalData(prev => {
        const newDataPoint = {
          timestamp: Date.now(),
          safe: parseFloat(gasInfo.safeGasPrice),
          standard: parseFloat(gasInfo.proposeGasPrice),
          fast: parseFloat(gasInfo.fastGasPrice),
        };
        
        const updated = [...prev, newDataPoint];
        // Keep only last 100 points
        return updated.slice(-100);
      });
    } catch (err) {
      console.error('Error fetching gas prices:', err);
      setError(err.message || 'Failed to fetch gas prices');
    } finally {
      setLoading(false);
    }
  }

  // Calculate cost in USD for display (assuming ETH price = $3000)
  const calculateCostUSD = (gasPrice, gasLimit = 21000, ethPrice = 3000) => {
    if (!gasPrice) return 0;
    // gasPrice is in Gwei, convert to ETH: (gasPrice * gasLimit) / 1e9
    const costInETH = (parseFloat(gasPrice) * gasLimit) / 1e9;
    return costInETH * ethPrice;
  };

  // Determine best time to transact
  const getBestTimeIndicator = () => {
    if (!gasData || historicalData.length < 10) return null;
    
    // Calculate average gas price from recent history
    const recentAverage = historicalData
      .slice(-20)
      .reduce((sum, item) => sum + item.standard, 0) / Math.min(20, historicalData.length);
    
    const currentGas = parseFloat(gasData.proposeGasPrice);
    const difference = ((currentGas - recentAverage) / recentAverage) * 100;
    
    if (difference < -10) {
      return { status: 'excellent', message: 'Excellent time to transact!', color: 'text-green-500', icon: '🟢' };
    } else if (difference < 0) {
      return { status: 'good', message: 'Good time to transact', color: 'text-green-400', icon: '🟢' };
    } else if (difference < 10) {
      return { status: 'average', message: 'Average gas prices', color: 'text-yellow-500', icon: '🟡' };
    } else if (difference < 25) {
      return { status: 'high', message: 'Gas prices are high', color: 'text-orange-500', icon: '🟠' };
    } else {
      return { status: 'very-high', message: 'Wait for lower prices', color: 'text-red-500', icon: '🔴' };
    }
  };

  // Format gas price with appropriate decimal places
  const formatGasPrice = (price) => {
    const num = parseFloat(price);
    if (num === 0) return '0 Gwei';
    // For very small numbers, show more decimals
    if (num < 0.001) return `${num.toFixed(6)} Gwei`;
    if (num < 0.01) return `${num.toFixed(5)} Gwei`;
    if (num < 0.1) return `${num.toFixed(4)} Gwei`;
    if (num < 1) return `${num.toFixed(3)} Gwei`;
    return `${num.toFixed(2)} Gwei`;
  };

  // Format USD amount
  const formatUSD = (amount) => {
    if (amount < 0.01) {
      return formatCurrencyPrice(amount, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
    return formatCurrencyPrice(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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

  const handleToggleChart = () => {
    const newValue = !showChart;
    setShowChart(newValue);
    onUpdateConfig?.({ ...config, showChart: newValue });
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

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white/60 text-xs mb-2">
            {new Date(data.timestamp).toLocaleTimeString()}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-green-400">Safe:</span>
              <span className="text-white font-semibold">{data.safe.toFixed(2)} Gwei</span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-yellow-400">Standard:</span>
              <span className="text-white font-semibold">{data.standard.toFixed(2)} Gwei</span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-red-400">Fast:</span>
              <span className="text-white font-semibold">{data.fast.toFixed(2)} Gwei</span>
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
      {/* Chart Toggle */}
      <CardSettingsToggle
        title="Historical Chart"
        description="Show gas price history chart"
        isOn={showChart}
        onToggle={handleToggleChart}
      />
    </div>
  );

  const bestTime = getBestTimeIndicator();

  return (
    <Card
      title="Gas Tracker"
      description="Base Network Gas Prices"
      image="/images/logos/base.svg"
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
      <div className="flex-1 flex flex-col space-y-4">
        {loading && !gasData ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 text-sm mb-2">Failed to load gas data</p>
              <p className="text-xs opacity-60">{error}</p>
            </div>
          </div>
        ) : gasData ? (
          <>
            {/* Best Time Indicator */}
            {bestTime && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-current/5 rounded-xl p-3 text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">{bestTime.icon}</span>
                  <span className={`text-sm font-semibold ${bestTime.color}`}>
                    {bestTime.message}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Current Gas Prices */}
            <div className="grid grid-cols-3 gap-3">
              {/* Safe */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-current/5 rounded-xl p-3 text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-base">🟢</span>
                  <p className="text-xs font-medium opacity-60">Safe</p>
                </div>
                <p className="text-lg font-bold text-green-500">
                  {formatGasPrice(gasData.safeGasPrice)}
                </p>
                <p className="text-xs opacity-40 mt-1">
                  {formatUSD(calculateCostUSD(gasData.safeGasPrice))}
                </p>
              </motion.div>

              {/* Standard */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-current/5 rounded-xl p-3 text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-base">⛽</span>
                  <p className="text-xs font-medium opacity-60">Standard</p>
                </div>
                <p className="text-lg font-bold text-yellow-500">
                  {formatGasPrice(gasData.proposeGasPrice)}
                </p>
                <p className="text-xs opacity-40 mt-1">
                  {formatUSD(calculateCostUSD(gasData.proposeGasPrice))}
                </p>
              </motion.div>

              {/* Fast */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-current/5 rounded-xl p-3 text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <HugeiconsIcon icon={Activity02Icon} className="w-4 h-4 text-red-500" />
                  <p className="text-xs font-medium opacity-60">Fast</p>
                </div>
                <p className="text-lg font-bold text-red-500">
                  {formatGasPrice(gasData.fastGasPrice)}
                </p>
                <p className="text-xs opacity-40 mt-1">
                  {formatUSD(calculateCostUSD(gasData.fastGasPrice))}
                </p>
              </motion.div>
            </div>

            {/* Block Info */}
            <div className="text-xs opacity-40 text-center">
              Updated: {new Date().toLocaleTimeString()} • Block: {gasData.lastBlock}
            </div>

            {/* Historical Chart */}
            {showChart && historicalData.length > 5 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-current/5 rounded-xl p-4"
              >
                <h4 className="text-sm font-semibold mb-3 opacity-80">Price History</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="safe"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#colorSafe)"
                      animationDuration={300}
                    />
                    <Area
                      type="monotone"
                      dataKey="standard"
                      stroke="#eab308"
                      strokeWidth={2}
                      fill="url(#colorStandard)"
                      animationDuration={300}
                    />
                    <Area
                      type="monotone"
                      dataKey="fast"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#colorFast)"
                      animationDuration={300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </Card>
  );
}

