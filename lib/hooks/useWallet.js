/**
 * useWallet Hook
 * Simplified hook for wallet connection and account management
 * Optimized for OnchainKit and Base
 */

'use client';

import { 
  useAccount, 
  useConnect, 
  useDisconnect,
  useBalance,
  useSwitchChain,
} from 'wagmi';
import { useState, useEffect } from 'react';
import { activeNetwork } from '@/config/networks';

/**
 * Main wallet hook
 * Provides all wallet-related functionality in one place
 */
export function useWallet() {
  // Account information
  const { 
    address, 
    isConnected, 
    isConnecting, 
    isDisconnected,
    chain,
    chainId,
  } = useAccount();

  // Connection
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Balance
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: activeNetwork.id,
  });

  /**
   * Connect to a specific wallet
   * @param {string} connectorId - Connector ID (e.g., 'coinbaseWalletSDK', 'metaMask')
   */
  const connectWallet = (connectorId) => {
    const connector = connectors.find(c => 
      c.id === connectorId || c.name.toLowerCase().includes(connectorId.toLowerCase())
    );
    
    if (connector) {
      connect({ connector, chainId: activeNetwork.id });
    } else {
      // Fallback to first available connector
      connect({ connector: connectors[0], chainId: activeNetwork.id });
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    disconnect();
  };

  /**
   * Switch to the correct network if user is on wrong one
   */
  const switchToActiveNetwork = () => {
    if (chainId !== activeNetwork.id) {
      switchChain({ chainId: activeNetwork.id });
    }
  };

  /**
   * Check if user is on the correct network
   */
  const isCorrectNetwork = chainId === activeNetwork.id;

  // Track window size for responsive formatting
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Get responsive truncation lengths based on window width
   * @param {number} width - Window width
   * @returns {object} Object with startLength and endLength
   */
  const getResponsiveLengths = (width) => {
    if (width < 640) {
      // Mobile: 6 chars start, 4 chars end
      return { startLength: 6, endLength: 4 };
    } else if (width < 768) {
      // Small screens: 8 chars start, 6 chars end
      return { startLength: 8, endLength: 6 };
    } else if (width < 1024) {
      // Medium screens: 10 chars start, 8 chars end
      return { startLength: 10, endLength: 8 };
    } else {
      // Large screens: 10 chars start, 8 chars end
      return { startLength: 10, endLength: 8 };
    }
  };

  /**
   * Format address for display (0x1234...5678)
   * Responsive: adapts to screen size automatically and updates on resize
   * @param {string} addr - Address to format
   * @param {object} options - Formatting options
   * @param {boolean} options.responsive - Use responsive formatting based on window size (default: true)
   * @param {number} options.startLength - Number of characters to show at start (overrides responsive)
   * @param {number} options.endLength - Number of characters to show at end (overrides responsive)
   */
  const formatAddress = (addr = address, options = {}) => {
    if (!addr) return '';
    
    const { 
      responsive = true, 
      startLength, 
      endLength 
    } = options;
    
    let finalStartLength = startLength;
    let finalEndLength = endLength;
    
    if (responsive) {
      const responsiveLengths = getResponsiveLengths(windowWidth);
      finalStartLength = finalStartLength ?? responsiveLengths.startLength;
      finalEndLength = finalEndLength ?? responsiveLengths.endLength;
    } else {
      // Non-responsive: use defaults
      finalStartLength = finalStartLength ?? 6;
      finalEndLength = finalEndLength ?? 4;
    }
    
    if (addr.length <= finalStartLength + finalEndLength) return addr;
    return `${addr.slice(0, finalStartLength)}...${addr.slice(-finalEndLength)}`;
  };

  return {
    // Connection state
    address,
    isConnected,
    isConnecting: isConnecting || isConnectPending,
    isDisconnected,
    
    // Chain info
    chain,
    chainId,
    isCorrectNetwork,
    activeNetwork,
    
    // Balance
    balance,
    isBalanceLoading,
    
    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    switchToActiveNetwork,
    
    // Available connectors
    connectors,
    
    // Utilities
    formatAddress,
  };
}

