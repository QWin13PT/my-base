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

  /**
   * Format address for display (0x1234...5678)
   */
  const formatAddress = (addr = address) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

