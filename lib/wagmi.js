/**
 * Wagmi Configuration for OnchainKit
 * Optimized for Base using OnchainKit's recommended setup
 */

import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { base, optimism, arbitrum } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
// import { walletConnect } from 'wagmi/connectors'; // Disabled temporarily
import { activeNetwork } from '@/config/networks';

/**
 * Map our network config to wagmi chains
 */
const chainMap = {
  base: base,
  optimism: optimism,
  arbitrum: arbitrum,
};

/**
 * Get the wagmi chain for the active network
 */
const getActiveChain = () => {
  return chainMap[activeNetwork.name] || base;
};

/**
 * Wagmi configuration optimized for Base with OnchainKit
 * Uses Coinbase Wallet as the primary connector (Base's recommended wallet)
 */
export const config = createConfig({
  chains: [getActiveChain()],
  connectors: [
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'MyBase',
      preference: 'all', // Support both Smart Wallet and extension
    }),
    
    // Injected wallets (MetaMask, Trust Wallet, etc.)
    injected({
      target() {
        return {
          id: 'injected',
          name: 'Browser Wallet',
          provider: typeof window !== 'undefined' ? window.ethereum : undefined,
        };
      },
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [getActiveChain().id]: http(),
  },
});

/**
 * Get all supported chains
 */
export const supportedChains = [getActiveChain()];

/**
 * Check if a chain is supported
 */
export const isChainSupported = (chainId) => {
  return supportedChains.some(chain => chain.id === chainId);
};

