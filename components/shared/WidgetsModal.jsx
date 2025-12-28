'use client';

import Modal from '@/components/ui/Modal';
import { getWidgetConstraints } from '@/lib/widgets';

// Available widgets organized by category
// Note: defaultSize is now automatically pulled from WIDGET_CONSTRAINTS in lib/widgets.js
const WIDGET_CATEGORIES = [
  {
    id: 'market',
    title: 'Market Data & Tokens',
    widgets: [
      {
        id: 'price-tracker',
        type: 'price-tracker',
        title: 'Price Tracker',
        description: 'Track real-time prices for popular Base tokens',
      },
      {
        id: 'price-chart',
        type: 'price-chart',
        title: 'Price Chart',
        description: 'View historical price charts with multiple time ranges',
      },
      {
        id: 'trending-tokens',
        type: 'trending-tokens',
        title: 'Trending Tokens',
        description: 'Top performing Base tokens by volume, price change, or market cap',
      },
      {
        id: 'fear-greed-index',
        type: 'fear-greed-index',
        title: 'Fear & Greed Index',
        description: 'Track crypto market sentiment with the Fear & Greed Index',
      },
    ],
  },
  {
    id: 'network',
    title: 'Network Statistics',
    widgets: [
      {
        id: 'gas-tracker',
        type: 'gas-tracker',
        title: 'Gas Tracker',
        description: 'Real-time gas prices with historical chart and best time indicator',
      },
    ],
  },
];

const WidgetsModal = ({ isOpen, onClose, onAddWidget }) => {
  const handleWidgetClick = (widget) => {
    if (onAddWidget) {
      // Get default size from widget constraints
      const constraints = getWidgetConstraints(widget.type);
      
      // Create widget with default size from constraints
      const widgetWithDefaults = {
        ...widget,
        w: constraints.defaultW,
        h: constraints.defaultH,
      };
      
      onAddWidget(widgetWithDefaults);
    }
    // Close modal after adding widget
    onClose();
  };

  return (
    <Modal
      title={<span className="text-white">Add a Widget</span>}
      description={<span className="text-gray-400">Customize your dashboard by adding widgets that provide specific functionalities and data.</span>}
      showModal={isOpen}
      closeModal={onClose}
      className="max-w-5xl"
    >
      <div className="space-y-8 pt-4">
        {WIDGET_CATEGORIES.map((category) => (
          <div key={category.id}>
            {/* Category Title */}
            <h3 className="text-base font-medium text-white/80 uppercase mb-4">
              {category.title}
            </h3>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.widgets.map((widget) => (
                <div
                  key={widget.id}
                  onClick={() => handleWidgetClick(widget)}
                  className="border-2 border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <h4 className="text-white font-semibold text-base mb-2 group-hover:text-blue-400 transition-colors">
                    {widget.title}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {widget.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default WidgetsModal;

