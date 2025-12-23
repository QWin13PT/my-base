/**
 * useLayouts Hook
 * Manages user dashboard layouts with localStorage fallback
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';
import { 
  getUserLayouts, 
  createLayout,
  updateLayout,
  deleteLayout,
  isSupabaseAvailable 
} from '@/lib/supabase';

/**
 * Layouts management hook
 * Handles layouts with Supabase (when authenticated) or localStorage fallback
 */
export function useLayouts() {
  const { user, isAuthenticated } = useUser();
  const [layouts, setLayouts] = useState([]);
  const [activeLayoutId, setActiveLayoutId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load layouts from Supabase or localStorage
   */
  const loadLayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated && isSupabaseAvailable() && user) {
        // Load from Supabase
        const data = await getUserLayouts(user.id);
        setLayouts(data);
        
        // Set active layout (default or first)
        const defaultLayout = data.find(l => l.is_default);
        setActiveLayoutId(defaultLayout?.id || data[0]?.id || null);
      } else {
        // Load from localStorage
        const stored = localStorage.getItem('mybase_layouts');
        const storedLayouts = stored ? JSON.parse(stored) : [];
        setLayouts(storedLayouts);
        
        // Set active layout
        const activeId = localStorage.getItem('mybase_active_layout');
        setActiveLayoutId(activeId || storedLayouts[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to load layouts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadLayouts();
  }, [loadLayouts]);

  /**
   * Save to localStorage (backup/fallback)
   */
  const saveToLocalStorage = useCallback((updatedLayouts) => {
    localStorage.setItem('mybase_layouts', JSON.stringify(updatedLayouts));
  }, []);

  /**
   * Create a new layout
   */
  const createNewLayout = async (layoutData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated && isSupabaseAvailable() && user) {
        // Save to Supabase
        const newLayout = await createLayout(user.id, layoutData);
        const updated = [...layouts, newLayout];
        setLayouts(updated);
        return newLayout;
      } else {
        // Save to localStorage
        const newLayout = {
          id: `local-${Date.now()}`,
          name: layoutData.name,
          is_default: layoutData.isDefault || false,
          is_public: false,
          widget_settings: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const updated = [...layouts, newLayout];
        setLayouts(updated);
        saveToLocalStorage(updated);
        return newLayout;
      }
    } catch (err) {
      console.error('Failed to create layout:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update a layout
   */
  const updateExistingLayout = async (layoutId, updates) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated && isSupabaseAvailable() && user) {
        // Update in Supabase
        const updatedLayout = await updateLayout(layoutId, updates);
        const updated = layouts.map(l => 
          l.id === layoutId ? updatedLayout : l
        );
        setLayouts(updated);
        return updatedLayout;
      } else {
        // Update in localStorage
        const updated = layouts.map(l => 
          l.id === layoutId 
            ? { ...l, ...updates, updated_at: new Date().toISOString() }
            : l
        );
        setLayouts(updated);
        saveToLocalStorage(updated);
        return updated.find(l => l.id === layoutId);
      }
    } catch (err) {
      console.error('Failed to update layout:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a layout
   */
  const removeLayout = async (layoutId) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated && isSupabaseAvailable() && user) {
        // Delete from Supabase
        await deleteLayout(layoutId);
      }
      
      // Remove from state
      const updated = layouts.filter(l => l.id !== layoutId);
      setLayouts(updated);
      
      // Update localStorage
      if (!isAuthenticated) {
        saveToLocalStorage(updated);
      }
      
      // Update active layout if deleted
      if (activeLayoutId === layoutId) {
        setActiveLayoutId(updated[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to delete layout:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set active layout
   */
  const setActive = (layoutId) => {
    setActiveLayoutId(layoutId);
    if (!isAuthenticated) {
      localStorage.setItem('mybase_active_layout', layoutId);
    }
  };

  /**
   * Get active layout object
   */
  const activeLayout = layouts.find(l => l.id === activeLayoutId) || null;

  return {
    layouts,
    activeLayout,
    activeLayoutId,
    isLoading,
    error,
    
    // Actions
    createLayout: createNewLayout,
    updateLayout: updateExistingLayout,
    deleteLayout: removeLayout,
    setActiveLayout: setActive,
    reload: loadLayouts,
  };
}

