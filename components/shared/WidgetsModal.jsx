'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CardSettingsTokenSelect from '@/components/cards/CardSettingsTokenSelect';
import CardSettingsToggle from '@/components/cards/CardSettingsToggle';
import { getWidgetConstraints } from '@/lib/widgets';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons-pro/core-stroke-standard';

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
        needsToken: true,
      },
      {
        id: 'price-chart',
        type: 'price-chart',
        title: 'Price Chart',
        description: 'View historical price charts with multiple time ranges',
        needsToken: true,
      },
      {
        id: 'volume-chart',
        type: 'volume-chart',
        title: 'Volume Chart',
        description: 'Trading volume chart with historical data and statistics',
        needsToken: true,
      },
      {
        id: 'trending-tokens',
        type: 'trending-tokens',
        title: 'Trending Tokens',
        description: 'Top performing Base tokens by volume, price change, or market cap',
        needsToken: false,
      },
      {
        id: 'fear-greed-index',
        type: 'fear-greed-index',
        title: 'Fear & Greed Index',
        description: 'Track crypto market sentiment with the Fear & Greed Index',
        needsToken: false,
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
        needsToken: false,
      },
    ],
  },
];

const WidgetsModal = ({ isOpen, onClose, onAddWidget }) => {
  const [step, setStep] = useState('select'); // 'select' | 'configure'
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showTitle, setShowTitle] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [showImage, setShowImage] = useState(true);

  // Reset state when modal is closed/opened
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedWidget(null);
      setSelectedToken(null);
      setShowTitle(true);
      setShowSubtitle(true);
      setShowImage(true);
    }
  }, [isOpen]);

  const handleWidgetClick = (widget) => {
    // If widget needs token configuration, go to configure step
    if (widget.needsToken) {
      setSelectedWidget(widget);
      setStep('configure');
    } else {
      // Otherwise add directly
      addWidget(widget);
    }
  };

  const addWidget = (widget, config = {}) => {
    if (onAddWidget) {
      // Get default size from widget constraints
      const constraints = getWidgetConstraints(widget.type);

      // Create widget with default size and configuration
      const widgetWithDefaults = {
        ...widget,
        w: constraints.defaultW,
        h: constraints.defaultH,
        showTitle,
        showSubtitle,
        showImage,
        ...config,
      };

      onAddWidget(widgetWithDefaults);
    }
    // Close modal after adding widget
    onClose();
  };

  const handleAddWidgetWithConfig = () => {
    if (!selectedWidget) return;

    // Build configuration based on widget type
    const config = {};

    // Add token ID if selected
    if (selectedToken) {
      config.tokenId = selectedToken.id;
    }

    addWidget(selectedWidget, config);
  };

  const handleBack = () => {
    setStep('select');
    setSelectedWidget(null);
    setSelectedToken(null);
  };

  return (
    <Modal
      title={
        step === 'select' ? (
          <span className="text-white">Add a Widget</span>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="!p-2 !px-2 !py-2 w-10 h-10"
              icon={<HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-white" />}
            />
            <span className="text-white">Configure {selectedWidget?.title} Widget</span>
          </div>
        )
      }
      description={
        step === 'select' ? (
          <span className="text-white/80">
            Customize your dashboard by adding widgets that provide specific functionalities and data.
          </span>
        ) : (
          <span className="text-white/80">
            Set up your {selectedWidget?.title} widget before adding it to your dashboard.
          </span>
        )
      }
      showModal={isOpen}
      closeModal={onClose}
      className="max-w-5xl"
    >
      {step === 'select' ? (
        // Widget Selection Step
        <div className="space-y-8 pt-4">
          {WIDGET_CATEGORIES.map((category) => (
            <div key={category.id}>
              {/* Category Title */}
              <h3 className="text-sm font-medium text-white/60 uppercase mb-4">
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
      ) : (
        // Widget Configuration Step
        <div className="pt-4 space-y-6">
          <div className="flex gap-4">
            {/* Token Selection */}
            {selectedWidget?.needsToken && (
              <div className="bg-white/5 rounded-2xl p-6">
                <CardSettingsTokenSelect
                  selectedToken={selectedToken}
                  onTokenSelect={setSelectedToken}
                  title="Select Token"
                  description="Choose which token this widget will track"
                />
              </div>
            )}

            {/* Display Options */}
            <div className="bg-white/5 rounded-2xl p-6 space-y-4 flex-1">
              <h4 className="text-sm font-medium text-white/60 uppercase mb-4">Display Options</h4>

              <CardSettingsToggle
                title="Show Title"
                description="Display the widget title"
                isOn={showTitle}
                onToggle={() => setShowTitle(!showTitle)}
              />

              <CardSettingsToggle
                title="Show Subtitle"
                description="Display the widget subtitle"
                isOn={showSubtitle}
                onToggle={() => setShowSubtitle(!showSubtitle)}
              />

              <CardSettingsToggle
                title="Show Image"
                description="Display the token/widget image"
                isOn={showImage}
                onToggle={() => setShowImage(!showImage)}
              />
            </div>
          </div>

          {/* Add Widget Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="transparent"
              onClick={handleBack}
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              onClick={handleAddWidgetWithConfig}
              disabled={selectedWidget?.needsToken && !selectedToken}
            >
              Add Widget
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default WidgetsModal;

