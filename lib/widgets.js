/**
 * Widget Registry
 * Central registry for all dashboard widgets
 * 
 * Add new widgets here to make them available throughout the app
 */

import { lazy } from 'react';

/**
 * Widget size definitions for react-grid-layout
 * Based on 12-column grid system
 */
export const widgetSizes = {
  small: {
    width: 1,
    height: 1,
    minWidth: 1,
    minHeight: 1,
  },
  medium: {
    width: 2,
    height: 2,
    minWidth: 2,
    minHeight: 2,
  },
  large: {
    width: 4,
    height: 2,
    minWidth: 3,
    minHeight: 2,
  },
};

/**
 * Widget constraints for react-grid-layout
 * Defines min/max width and height for each widget type
 * Based on 12-column grid, rowHeight: 192px
 */
export const WIDGET_CONSTRAINTS = {
  'price-tracker': {
    minW: 2,
    maxW: 3,
    minH: 1,
    maxH: 2,
    defaultW: 2,
    defaultH: 1,
  },
  'price-chart': {
    minW: 3,   // Charts need minimum space
    maxW: 12,
    minH: 2,   // Need height for chart visibility
    maxH: 6,
    defaultW: 3,
    defaultH: 2,
  },
  'volume-chart': {
    minW: 3,   // Charts need minimum space
    maxW: 12,
    minH: 2,   // Need height for chart visibility
    maxH: 6,
    defaultW: 3,
    defaultH: 2,
  },
  'fear-greed-index': {
    minW: 2,
    maxW: 4,
    minH: 1,
    maxH: 3,
    defaultW: 3,
    defaultH: 2,
  },
  'gas-tracker': {
    minW: 3,
    maxW: 6,
    minH: 1,
    maxH: 4,
    defaultW: 3,
    defaultH: 2,
  },
  'trending-tokens': {
    minW: 3,
    maxW: 8,
    minH: 3,   // Need height for list items
    maxH: 6,
    defaultW: 4,
    defaultH: 4,
  },
};

/**
 * Default constraints for widgets without specific constraints
 */
export const DEFAULT_CONSTRAINTS = {
  minW: 2,
  maxW: 12,
  minH: 1,
  maxH: 6,
  defaultW: 3,
  defaultH: 2,
};

/**
 * Get constraints for a widget type
 * @param {string} widgetType - Widget type (e.g., 'price-tracker')
 * @returns {Object} Constraints object with minW, maxW, minH, maxH, defaultW, defaultH
 */
export const getWidgetConstraints = (widgetType) => {
  return WIDGET_CONSTRAINTS[widgetType] || DEFAULT_CONSTRAINTS;
};

/**
 * Widget Registry
 * Each widget must have:
 * - id: Unique identifier
 * - name: Display name
 * - description: Short description
 * - icon: Icon (emoji or component)
 * - component: Lazy-loaded component
 * - defaultSize: Default size (small | medium | large)
 * - defaultConfig: Default configuration object
 * - configSchema: Schema for widget settings UI
 * - category: Widget category for organization
 * 
 * Note: Only implemented widgets are included. Commented widgets are placeholders for future implementation.
 */
export const widgetRegistry = {
  priceTracker: {
    id: 'priceTracker',
    name: 'Price Tracker',
    description: 'Real-time token prices with 24h change indicators',
    icon: '💰',
    category: 'defi',
    component: lazy(() => import('@/components/widgets/PriceTracker')),
    defaultSize: 'medium',
    defaultConfig: {
      tokens: ['ethereum', 'usd-coin'],
      refreshInterval: 30000, // 30 seconds
      showChart: true,
      showChange: true,
    },
    configSchema: {
      tokens: {
        type: 'tokenList',
        label: 'Tokens to track',
        placeholder: 'Search tokens...',
        min: 1,
        max: 10,
      },
      refreshInterval: {
        type: 'select',
        label: 'Refresh interval',
        options: [
          { value: 10000, label: '10 seconds' },
          { value: 30000, label: '30 seconds' },
          { value: 60000, label: '1 minute' },
          { value: 300000, label: '5 minutes' },
        ],
      },
      showChart: {
        type: 'boolean',
        label: 'Show mini chart',
      },
      showChange: {
        type: 'boolean',
        label: 'Show 24h change',
      },
    },
  },

  priceChart: {
    id: 'priceChart',
    name: 'Price Chart',
    description: 'Historical price charts with multiple time ranges',
    icon: '📈',
    category: 'defi',
    component: lazy(() => import('@/components/widgets/PriceChart')),
    defaultSize: 'large',
    defaultConfig: {
      tokenId: 'ethereum',
      timeRange: '7d',
      showVolume: true,
    },
    configSchema: {
      tokenId: {
        type: 'token',
        label: 'Token to chart',
        placeholder: 'Search token...',
      },
      timeRange: {
        type: 'select',
        label: 'Time range',
        options: [
          { value: '1d', label: '1 Day' },
          { value: '7d', label: '7 Days' },
          { value: '30d', label: '30 Days' },
          { value: '90d', label: '90 Days' },
          { value: '1y', label: '1 Year' },
        ],
      },
      showVolume: {
        type: 'boolean',
        label: 'Show volume',
      },
    },
  },

  volumeChart: {
    id: 'volumeChart',
    name: 'Volume Chart',
    description: 'Trading volume chart with historical data',
    icon: '📊',
    category: 'defi',
    component: lazy(() => import('@/components/widgets/VolumeChart')),
    defaultSize: 'large',
    defaultConfig: {
      tokenId: 'ethereum',
      timeRange: '7d',
      showVolumeInfo: true,
    },
    configSchema: {
      tokenId: {
        type: 'token',
        label: 'Token to chart',
        placeholder: 'Search token...',
      },
      timeRange: {
        type: 'select',
        label: 'Time range',
        options: [
          { value: '1d', label: '1 Day' },
          { value: '7d', label: '7 Days' },
          { value: '30d', label: '30 Days' },
          { value: '90d', label: '90 Days' },
          { value: '1y', label: '1 Year' },
        ],
      },
      showVolumeInfo: {
        type: 'boolean',
        label: 'Show volume info',
      },
    },
  },

  fearGreedIndex: {
    id: 'fearGreedIndex',
    name: 'Fear & Greed Index',
    description: 'Track crypto market sentiment with the Fear & Greed Index',
    icon: '😱',
    category: 'analytics',
    component: lazy(() => import('@/components/widgets/FearGreedIndex')),
    defaultSize: 'medium',
    defaultConfig: {
      showHistory: false,
      refreshInterval: 300000, // 5 minutes
    },
    configSchema: {
      showHistory: {
        type: 'boolean',
        label: 'Show historical data',
      },
      refreshInterval: {
        type: 'select',
        label: 'Refresh interval',
        options: [
          { value: 300000, label: '5 minutes' },
          { value: 600000, label: '10 minutes' },
          { value: 1800000, label: '30 minutes' },
        ],
      },
    },
  },

  // FUTURE WIDGETS - Uncomment when implemented
  // portfolioChart: {
  //   id: 'portfolioChart',
  //   name: 'Portfolio Chart',
  //   description: 'Visualize your wallet holdings',
  //   icon: '📊',
  //   category: 'portfolio',
  //   component: lazy(() => import('@/components/widgets/PortfolioChart')),
  //   defaultSize: 'large',
  //   defaultConfig: {
  //     chartType: 'pie', // pie | bar | line
  //     showValue: true,
  //     showPercentage: true,
  //   },
  //   configSchema: {
  //     chartType: {
  //       type: 'select',
  //       label: 'Chart type',
  //       options: [
  //         { value: 'pie', label: 'Pie Chart' },
  //         { value: 'bar', label: 'Bar Chart' },
  //         { value: 'line', label: 'Line Chart' },
  //       ],
  //     },
  //     showValue: {
  //       type: 'boolean',
  //       label: 'Show values',
  //     },
  //     showPercentage: {
  //       type: 'boolean',
  //       label: 'Show percentages',
  //     },
  //   },
  // },

  // richListViewer: {
  //   id: 'richListViewer',
  //   name: 'Rich List',
  //   description: 'Top wallets by holdings on the network',
  //   icon: '👑',
  //   category: 'analytics',
  //   component: lazy(() => import('@/components/widgets/RichListViewer')),
  //   defaultSize: 'medium',
  //   defaultConfig: {
  //     limit: 10,
  //     sortBy: 'balance', // balance | transactions | age
  //     hideSmallBalances: true,
  //   },
  //   configSchema: {
  //     limit: {
  //       type: 'select',
  //       label: 'Number of wallets',
  //       options: [
  //         { value: 5, label: 'Top 5' },
  //         { value: 10, label: 'Top 10' },
  //         { value: 20, label: 'Top 20' },
  //         { value: 50, label: 'Top 50' },
  //       ],
  //     },
  //     sortBy: {
  //       type: 'select',
  //       label: 'Sort by',
  //       options: [
  //         { value: 'balance', label: 'Balance' },
  //         { value: 'transactions', label: 'Transaction count' },
  //         { value: 'age', label: 'Account age' },
  //       ],
  //     },
  //   },
  // },

  // quickSwap: {
  //   id: 'quickSwap',
  //   name: 'Quick Swap',
  //   description: 'Embedded DEX swap interface',
  //   icon: '🔄',
  //   category: 'defi',
  //   component: lazy(() => import('@/components/widgets/QuickSwap')),
  //   defaultSize: 'medium',
  //   defaultConfig: {
  //     defaultFrom: 'ETH',
  //     defaultTo: 'USDC',
  //     slippage: 0.5,
  //   },
  //   configSchema: {
  //     slippage: {
  //       type: 'number',
  //       label: 'Slippage tolerance (%)',
  //       min: 0.1,
  //       max: 5,
  //       step: 0.1,
  //     },
  //   },
  // },

  // networkStats: {
  //   id: 'networkStats',
  //   name: 'Network Stats',
  //   description: 'Network activity, gas prices, and TVL',
  //   icon: '📡',
  //   category: 'analytics',
  //   component: lazy(() => import('@/components/widgets/NetworkStats')),
  //   defaultSize: 'medium',
  //   defaultConfig: {
  //     showGas: true,
  //     showTVL: true,
  //     showTransactions: true,
  //     refreshInterval: 60000, // 1 minute
  //   },
  //   configSchema: {
  //     showGas: {
  //       type: 'boolean',
  //       label: 'Show gas prices',
  //     },
  //     showTVL: {
  //       type: 'boolean',
  //       label: 'Show TVL',
  //     },
  //     showTransactions: {
  //       type: 'boolean',
  //       label: 'Show transaction count',
  //     },
  //     refreshInterval: {
  //       type: 'select',
  //       label: 'Refresh interval',
  //       options: [
  //         { value: 30000, label: '30 seconds' },
  //         { value: 60000, label: '1 minute' },
  //         { value: 300000, label: '5 minutes' },
  //       ],
  //     },
  //   },
  // },

  gasTracker: {
    id: 'gasTracker',
    name: 'Gas Tracker',
    description: 'Real-time Base network gas prices with historical chart',
    icon: '⛽',
    category: 'analytics',
    component: lazy(() => import('@/components/widgets/GasTracker')),
    defaultSize: 'medium',
    defaultConfig: {
      showChart: true,
      refreshInterval: 15000, // 15 seconds
    },
    configSchema: {
      showChart: {
        type: 'boolean',
        label: 'Show historical chart',
      },
      refreshInterval: {
        type: 'select',
        label: 'Refresh interval',
        options: [
          { value: 10000, label: '10 seconds' },
          { value: 15000, label: '15 seconds' },
          { value: 30000, label: '30 seconds' },
          { value: 60000, label: '1 minute' },
        ],
      },
    },
  },

  trendingTokens: {
    id: 'trendingTokens',
    name: 'Trending Tokens',
    description: 'Top performing tokens on Base network',
    icon: '🔥',
    category: 'analytics',
    component: lazy(() => import('@/components/widgets/TrendingTokens')),
    defaultSize: 'medium',
    defaultConfig: {
      showVolume: true,
      showMarketCap: false,
      limit: 10,
      sortBy: 'volume', // volume, price_change, market_cap
    },
    configSchema: {
      limit: {
        type: 'select',
        label: 'Number of tokens',
        options: [
          { value: 5, label: 'Top 5' },
          { value: 10, label: 'Top 10' },
          { value: 15, label: 'Top 15' },
          { value: 20, label: 'Top 20' },
        ],
      },
      sortBy: {
        type: 'select',
        label: 'Sort by',
        options: [
          { value: 'volume', label: '24h Volume' },
          { value: 'price_change', label: '24h Price Change' },
          { value: 'market_cap', label: 'Market Cap' },
        ],
      },
      showVolume: {
        type: 'boolean',
        label: 'Show 24h volume',
      },
      showMarketCap: {
        type: 'boolean',
        label: 'Show market cap',
      },
    },
  },
};

/**
 * Widget categories for organization
 */
export const widgetCategories = {
  defi: {
    id: 'defi',
    name: 'DeFi',
    icon: '💎',
    description: 'DeFi and trading widgets',
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '💼',
    description: 'Track your holdings',
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    icon: '📈',
    description: 'Network and market analytics',
  },
  social: {
    id: 'social',
    name: 'Social',
    icon: '👥',
    description: 'Community and social features',
  },
};

/**
 * Get a widget by ID
 * @param {string} id - Widget ID
 * @returns {Object|null} Widget configuration
 */
export const getWidget = (id) => {
  return widgetRegistry[id] || null;
};

/**
 * Get all widgets
 * @returns {Array} Array of all widgets
 */
export const getAllWidgets = () => {
  return Object.values(widgetRegistry);
};

/**
 * Get widgets by category
 * @param {string} category - Category ID
 * @returns {Array} Array of widgets in category
 */
export const getWidgetsByCategory = (category) => {
  return Object.values(widgetRegistry).filter(
    widget => widget.category === category
  );
};

/**
 * Get all categories with their widgets
 * @returns {Object} Categories with widgets
 */
export const getCategorizedWidgets = () => {
  const categorized = {};
  
  Object.values(widgetCategories).forEach(category => {
    categorized[category.id] = {
      ...category,
      widgets: getWidgetsByCategory(category.id),
    };
  });
  
  return categorized;
};

/**
 * Create a new widget instance with default config
 * @param {string} widgetType - Widget type ID
 * @param {Object} overrides - Config overrides
 * @returns {Object} Widget instance
 */
export const createWidgetInstance = (widgetType, overrides = {}) => {
  const widget = getWidget(widgetType);
  
  if (!widget) {
    throw new Error(`Widget type '${widgetType}' not found`);
  }
  
  return {
    id: `${widgetType}-${Date.now()}`,
    type: widgetType,
    size: widget.defaultSize,
    config: {
      ...widget.defaultConfig,
      ...overrides,
    },
  };
};

