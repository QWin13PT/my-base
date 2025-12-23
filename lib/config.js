/**
 * Master Application Configuration
 * Central configuration file for white-labeling and feature flags
 */

import { activeNetwork } from '@/config/networks';
import { colors } from './theme';

/**
 * Application metadata and branding
 */
export const appConfig = {
  // Basic app info
  name: process.env.NEXT_PUBLIC_APP_NAME || 'mybase',
  tagline: process.env.NEXT_PUBLIC_TAGLINE || 'MyBase, my rules — drag, drop, make it yours',
  description: 'A white-label, drag-and-drop dashboard platform for crypto users',
  version: '0.1.0',
  
  // Network configuration
  network: activeNetwork,
  
  // Theme configuration
  theme: colors,
  
  // Feature flags
  features: {
    walletConnect: true,
    multiLayout: true,
    communityHub: true,
    shareLinks: true,
    templates: true,
    darkMode: true,
    customThemes: false, // Future feature
    notifications: false, // Future feature
  },
  
  // Branding assets
  branding: {
    logo: activeNetwork.branding.logo,
    favicon: '/favicon.ico',
    ogImage: '/og-image.png',
  },
  
  // Social links (for footer/community)
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || '',
    discord: process.env.NEXT_PUBLIC_DISCORD_URL || '',
    github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/mybase',
    docs: process.env.NEXT_PUBLIC_DOCS_URL || '',
  },
  
  // Default dashboard configuration
  defaults: {
    // Default widgets for new users
    widgets: [
      {
        id: 'default-price-tracker',
        type: 'priceTracker',
        position: { x: 0, y: 0 },
        size: 'medium',
        config: {
          tokens: ['ethereum', 'usd-coin', 'wrapped-bitcoin'],
          refreshInterval: 30000,
        },
      },
      {
        id: 'default-network-stats',
        type: 'networkStats',
        position: { x: 1, y: 0 },
        size: 'medium',
        config: {},
      },
    ],
    
    // Default layout name
    layoutName: 'My Dashboard',
    
    // Grid configuration
    grid: {
      columns: 12,
      rowHeight: 100,
      gap: 16,
    },
  },
  
  // Limits and constraints
  limits: {
    maxLayouts: 10,
    maxWidgetsPerLayout: 20,
    maxTemplatesPerUser: 5,
  },
  
  // Analytics configuration
  analytics: {
    enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
    vercelAnalytics: true,
  },
};

/**
 * Environment-specific configuration
 */
export const env = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

/**
 * Get feature flag value
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
export const isFeatureEnabled = (feature) => {
  return appConfig.features[feature] || false;
};

/**
 * Get network-specific configuration
 * @returns {Object}
 */
export const getNetworkConfig = () => {
  return {
    id: activeNetwork.id,
    name: activeNetwork.displayName,
    explorer: activeNetwork.blockExplorers.default.url,
    currency: activeNetwork.nativeCurrency,
  };
};

/**
 * Get branding colors for the active network
 * @returns {Object}
 */
export const getBrandingColors = () => {
  return activeNetwork.branding;
};

