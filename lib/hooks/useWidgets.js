'use client';

import { useState, useEffect } from 'react';

/**
 * useWidgets hook - Manages widget state with localStorage persistence
 * Handles adding, removing, and reordering widgets
 */
export const useWidgets = (userId) => {
  const [widgets, setWidgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load widgets from localStorage on mount
  useEffect(() => {
    const loadWidgets = () => {
      try {
        const key = userId ? `widgets_${userId}` : 'widgets_guest';
        const stored = localStorage.getItem(key);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          setWidgets(parsed);
        } else {
          // Set default widgets if none exist
          setWidgets(getDefaultWidgets());
        }
      } catch (error) {
        console.error('Error loading widgets:', error);
        setWidgets(getDefaultWidgets());
      } finally {
        setIsLoading(false);
      }
    };

    loadWidgets();
  }, [userId]);

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        const key = userId ? `widgets_${userId}` : 'widgets_guest';
        localStorage.setItem(key, JSON.stringify(widgets));
      } catch (error) {
        console.error('Error saving widgets:', error);
      }
    }
  }, [widgets, userId, isLoading]);

  const addWidget = (widget) => {
    // Generate unique ID (don't use widget.id to avoid duplicates)
    const { id, ...widgetWithoutId } = widget;
    const newWidget = {
      ...widgetWithoutId,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setWidgets((prev) => [...prev, newWidget]);
    return newWidget;
  };

  const removeWidget = (widgetId) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  };

  const updateWidget = (widgetId, updates) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, ...updates } : w))
    );
  };

  const reorderWidgets = (newWidgets) => {
    setWidgets(newWidgets);
  };

  const resetWidgets = () => {
    setWidgets(getDefaultWidgets());
  };

  return {
    widgets,
    isLoading,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    resetWidgets,
  };
};

/**
 * Get default widgets for new users
 * Layout uses a 12-column grid system
 */
const getDefaultWidgets = () => {
  return [
    {
      id: 'widget-1',
      title: 'Price Tracker',
      description: 'Real-time token prices',
      icon: '💰',
      type: 'priceTracker',
      x: 0,
      y: 0,
      w: 4,
      h: 2,
    },
    {
      id: 'widget-2',
      title: 'Portfolio Chart',
      description: 'Your wallet holdings',
      icon: '📊',
      type: 'portfolioChart',
      x: 4,
      y: 0,
      w: 4,
      h: 2,
    },
    {
      id: 'widget-3',
      title: 'Network Stats',
      description: 'Gas prices & TVL',
      icon: '📡',
      type: 'networkStats',
      x: 8,
      y: 0,
      w: 4,
      h: 2,
    },
    {
      id: 'widget-4',
      title: 'Quick Swap',
      description: 'Swap tokens instantly',
      icon: '🔄',
      type: 'quickSwap',
      x: 0,
      y: 2,
      w: 6,
      h: 3,
    },
    {
      id: 'widget-5',
      title: 'Rich List',
      description: 'Top wallets on Base',
      icon: '👑',
      type: 'richListViewer',
      x: 6,
      y: 2,
      w: 3,
      h: 3,
    },
    {
      id: 'widget-6',
      title: 'Trending',
      description: 'Hot tokens today',
      icon: '🔥',
      type: 'trending',
      x: 9,
      y: 2,
      w: 3,
      h: 3,
    },
  ];
};

