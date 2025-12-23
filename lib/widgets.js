/**
 * Widget Registry
 * Central registry for all dashboard widgets
 * 
 * Add new widgets here to make them available throughout the app
 */

import { lazy } from 'react';

/**
 * Widget size definitions
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

  portfolioChart: {
    id: 'portfolioChart',
    name: 'Portfolio Chart',
    description: 'Visualize your wallet holdings',
    icon: '📊',
    category: 'portfolio',
    component: lazy(() => import('@/components/widgets/PortfolioChart')),
    defaultSize: 'large',
    defaultConfig: {
      chartType: 'pie', // pie | bar | line
      showValue: true,
      showPercentage: true,
    },
    configSchema: {
      chartType: {
        type: 'select',
        label: 'Chart type',
        options: [
          { value: 'pie', label: 'Pie Chart' },
          { value: 'bar', label: 'Bar Chart' },
          { value: 'line', label: 'Line Chart' },
        ],
      },
      showValue: {
        type: 'boolean',
        label: 'Show values',
      },
      showPercentage: {
        type: 'boolean',
        label: 'Show percentages',
      },
    },
  },

  richListViewer: {
    id: 'richListViewer',
    name: 'Rich List',
    description: 'Top wallets by holdings on the network',
    icon: '👑',
    category: 'analytics',
    component: lazy(() => import('@/components/widgets/RichListViewer')),
    defaultSize: 'medium',
    defaultConfig: {
      limit: 10,
      sortBy: 'balance', // balance | transactions | age
      hideSmallBalances: true,
    },
    configSchema: {
      limit: {
        type: 'select',
        label: 'Number of wallets',
        options: [
          { value: 5, label: 'Top 5' },
          { value: 10, label: 'Top 10' },
          { value: 20, label: 'Top 20' },
          { value: 50, label: 'Top 50' },
        ],
      },
      sortBy: {
        type: 'select',
        label: 'Sort by',
        options: [
          { value: 'balance', label: 'Balance' },
          { value: 'transactions', label: 'Transaction count' },
          { value: 'age', label: 'Account age' },
        ],
      },
    },
  },

  quickSwap: {
    id: 'quickSwap',
    name: 'Quick Swap',
    description: 'Embedded DEX swap interface',
    icon: '🔄',
    category: 'defi',
    component: lazy(() => import('@/components/widgets/QuickSwap')),
    defaultSize: 'medium',
    defaultConfig: {
      defaultFrom: 'ETH',
      defaultTo: 'USDC',
      slippage: 0.5,
    },
    configSchema: {
      slippage: {
        type: 'number',
        label: 'Slippage tolerance (%)',
        min: 0.1,
        max: 5,
        step: 0.1,
      },
    },
  },

  networkStats: {
    id: 'networkStats',
    name: 'Network Stats',
    description: 'Network activity, gas prices, and TVL',
    icon: '📡',
    category: 'analytics',
    component: lazy(() => import('@/components/widgets/NetworkStats')),
    defaultSize: 'medium',
    defaultConfig: {
      showGas: true,
      showTVL: true,
      showTransactions: true,
      refreshInterval: 60000, // 1 minute
    },
    configSchema: {
      showGas: {
        type: 'boolean',
        label: 'Show gas prices',
      },
      showTVL: {
        type: 'boolean',
        label: 'Show TVL',
      },
      showTransactions: {
        type: 'boolean',
        label: 'Show transaction count',
      },
      refreshInterval: {
        type: 'select',
        label: 'Refresh interval',
        options: [
          { value: 30000, label: '30 seconds' },
          { value: 60000, label: '1 minute' },
          { value: 300000, label: '5 minutes' },
        ],
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

