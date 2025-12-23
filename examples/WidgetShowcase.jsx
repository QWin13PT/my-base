'use client';

/**
 * Widget Showcase
 * Example page demonstrating all available widgets
 * Copy this to app/widgets/page.js to use as a test page
 */

import {
  PriceTrackerWidget,
  NetworkStatsWidget,
  GasTrackerWidget,
  PortfolioWidget,
} from '@/components/widgets';

export default function WidgetShowcase() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">MyBase Widgets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Preview of all available dashboard widgets with live data
          </p>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Price Tracker - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PriceTrackerWidget />
          </div>

          {/* Network Stats */}
          <div className="lg:col-span-1">
            <NetworkStatsWidget />
          </div>

          {/* Gas Tracker */}
          <div className="lg:col-span-1">
            <GasTrackerWidget />
          </div>

          {/* Portfolio - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PortfolioWidget />
          </div>
        </div>

        {/* Custom Token Price Tracker */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Custom Token List</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meme Coins Only */}
            <PriceTrackerWidget 
              tokens={['BRETT', 'DEGEN', 'TOSHI', 'NORMIE']} 
            />
            
            {/* Stablecoins Only */}
            <PriceTrackerWidget 
              tokens={['USDC', 'USDT', 'DAI']} 
            />
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

