'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * useLayouts hook - Manages multiple dashboard layouts
 * Currently uses localStorage, designed to easily migrate to Supabase
 * 
 * Future Supabase migration:
 * - Replace localStorage with Supabase queries
 * - Keep the same API interface
 * - Add real-time sync capabilities
 */
export const useLayouts = (userId) => {
  const [layouts, setLayouts] = useState([]);
  const [activeLayoutId, setActiveLayoutId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Storage keys
  const getStorageKeys = useCallback(() => {
    const userKey = userId || 'guest';
    return {
      layoutsKey: `layouts_${userKey}`,
      activeKey: `active_layout_${userKey}`,
    };
  }, [userId]);

  // Load layouts from localStorage on mount
  useEffect(() => {
    const loadLayouts = () => {
      try {
        const { layoutsKey, activeKey } = getStorageKeys();
        const storedLayouts = localStorage.getItem(layoutsKey);
        const storedActiveId = localStorage.getItem(activeKey);

        if (storedLayouts) {
          const parsed = JSON.parse(storedLayouts);
          setLayouts(parsed);
          setActiveLayoutId(storedActiveId || parsed[0]?.id);
        } else {
          // Create default layout
          const defaultLayout = createDefaultLayout();
          setLayouts([defaultLayout]);
          setActiveLayoutId(defaultLayout.id);
        }
      } catch (error) {
        console.error('Error loading layouts:', error);
        const defaultLayout = createDefaultLayout();
        setLayouts([defaultLayout]);
        setActiveLayoutId(defaultLayout.id);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayouts();
  }, [userId, getStorageKeys]);

  // Save layouts to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && layouts.length > 0) {
      try {
        const { layoutsKey, activeKey } = getStorageKeys();
        localStorage.setItem(layoutsKey, JSON.stringify(layouts));
        if (activeLayoutId) {
          localStorage.setItem(activeKey, activeLayoutId);
        }
      } catch (error) {
        console.error('Error saving layouts:', error);
      }
    }
  }, [layouts, activeLayoutId, isLoading, getStorageKeys]);

  // Get active layout
  const activeLayout = layouts.find(l => l.id === activeLayoutId);

  // Create new layout
  const createLayout = (name = 'New Dashboard') => {
    const newLayout = {
      id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      widgets: [],
      userId: userId || 'guest',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLayouts(prev => [...prev, newLayout]);
    return newLayout;
  };

  // Switch to a different layout
  const switchLayout = (layoutId) => {
    const layout = layouts.find(l => l.id === layoutId);
    if (layout) {
      setActiveLayoutId(layoutId);
      return layout;
    }
    return null;
  };

  // Update layout name
  const renameLayout = (layoutId, newName) => {
    setLayouts(prev =>
      prev.map(layout =>
        layout.id === layoutId
          ? { ...layout, name: newName, updatedAt: new Date().toISOString() }
          : layout
      )
    );
  };

  // Update layout widgets
  const updateLayoutWidgets = (layoutId, widgets) => {
    setLayouts(prev =>
      prev.map(layout =>
        layout.id === layoutId
          ? { ...layout, widgets, updatedAt: new Date().toISOString() }
          : layout
      )
    );
  };

  // Delete layout (cannot delete if it's the only one)
  const deleteLayout = (layoutId) => {
    if (layouts.length <= 1) {
      console.warn('Cannot delete the only layout');
      return false;
    }

    setLayouts(prev => prev.filter(l => l.id !== layoutId));

    // If deleting active layout, switch to first available
    if (layoutId === activeLayoutId) {
      const remainingLayouts = layouts.filter(l => l.id !== layoutId);
      setActiveLayoutId(remainingLayouts[0]?.id);
    }

    return true;
  };

  // Duplicate layout
  const duplicateLayout = (layoutId) => {
    const layoutToDuplicate = layouts.find(l => l.id === layoutId);
    if (!layoutToDuplicate) return null;

    const newLayout = {
      ...layoutToDuplicate,
      id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${layoutToDuplicate.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLayouts(prev => [...prev, newLayout]);
    return newLayout;
  };

  return {
    layouts,
    activeLayout,
    activeLayoutId,
    isLoading,
    createLayout,
    switchLayout,
    renameLayout,
    updateLayoutWidgets,
    deleteLayout,
    duplicateLayout,
  };
};

/**
 * Create default layout for new users
 */
const createDefaultLayout = () => {
  return {
    id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Main Dashboard',
    widgets: [],
    userId: 'guest',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
