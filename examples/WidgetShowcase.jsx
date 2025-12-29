'use client';

/**
 * Widget Showcase
 * Example page demonstrating all available widgets
 * Copy this to app/widgets/page.js to use as a test page
 */

import {
  PriceTracker,
  GasTracker,
  TrendingTokens,
  PortfolioTracker,
} from '@/components/widgets';

export default function WidgetShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Otlyn Widgets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Preview of all available dashboard widgets with live data
          </p>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Price Tracker - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PriceTracker />
          </div>

          {/* Gas Tracker */}
          <div className="lg:col-span-1">
            <GasTracker />
          </div>

          {/* Portfolio Tracker - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PortfolioTracker />
          </div>

          {/* Trending Tokens */}
          <div className="lg:col-span-1">
            <TrendingTokens />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Data provided by CoinGecko, DeFiLlama, and Basescan APIs</p>
          <p className="mt-2">
            All widgets include automatic rate limiting and caching
          </p>
        </footer>
      </div>
    </div>
  );
}

