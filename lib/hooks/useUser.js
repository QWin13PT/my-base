/**
 * useUser Hook
 * Manages user authentication and profile with Supabase
 */

'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { getOrCreateUser } from '@/lib/supabase';

/**
 * User authentication hook
 * Automatically creates/fetches user profile when wallet is connected
 */
export function useUser() {
  const { address, isConnected } = useWallet();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      if (!isConnected || !address) {
        setUser(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const userData = await getOrCreateUser(address);
        
        if (mounted) {
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [address, isConnected]);

  /**
   * Update user profile
   * @param {Object} updates - Fields to update
   */
  const updateProfile = async (updates) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { supabase } = await import('@/lib/supabase');
      
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      return data;
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user needs onboarding (no username set)
   */
  const needsOnboarding = user && !user.username;

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    if (!address || !isConnected) return;
    
    try {
      const userData = await getOrCreateUser(address);
      setUser(userData);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user && isConnected,
    needsOnboarding,
    updateProfile,
    refreshUser,
  };
}

