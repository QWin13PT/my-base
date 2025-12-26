/**
 * ConnectWallet Component
 * Wallet connection with Base network validation
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';


export function ConnectWallet({ className }) {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showConnectors, setShowConnectors] = useState(false);

  // Check if on Base network
  const isOnBase = chain?.id === base.id;

  // Auto-switch to Base when connected to wrong network
  useEffect(() => {
    if (isConnected && !isOnBase) {
      switchChain({ chainId: base.id });
    }
  }, [isConnected, isOnBase, switchChain]);

  // Connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {/* Wrong network warning */}
        {!isOnBase && (
          <button
            onClick={() => switchChain({ chainId: base.id })}
            className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 transition-colors font-medium"
          >
            Switch to Base
          </button>
        )}
        
        {/* Disconnect button */}
        <Button
          onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  // Not connected
  return (
    <>
      <Button 
        onClick={() => setShowConnectors(true)}
        disabled={isPending}
        variant="primary"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {/* Wallet selector modal */}
      <Modal
        title="Connect Wallet"
        description="Only Base network addresses"
        showModal={showConnectors}
        closeModal={() => setShowConnectors(false)}
        className="max-w-md"
      >
        <div className="space-y-2">
          {/* All wallet connectors - Coinbase Wallet at bottom */}
          {connectors
            .filter(connector => connector.name !== 'Browser Wallet')
            .sort((a, b) => {
              // Move Coinbase Wallet to bottom
              if (a.name === 'Coinbase Wallet') return 1;
              if (b.name === 'Coinbase Wallet') return -1;
              return 0;
            })
            .map((connector) => {
              const isCoinbase = connector.name === 'Coinbase Wallet';
              
              // Map wallet images
              const walletImages = {
                'MetaMask': '/images/logos/metamask.svg',
                'WalletConnect': '/images/logos/walletconnect.svg',
                'Subwallet': '/images/logos/subwallet.svg',
                'SubWallet': '/images/logos/subwallet.svg',
                'Trust Wallet': '/images/logos/trust-wallet.svg',
                'Coinbase Wallet': '/images/logos/coinbase-wallet.svg',
              };
              
              const walletImage = walletImages[connector.name];
              
              return (
                <Button
                  key={connector.id}
                  rounded="lg"
                  onClick={() => {
                    connect({ 
                      connector,
                      chainId: base.id, // Connect to Base network
                    });
                    setShowConnectors(false);
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={isCoinbase}
                  image={walletImage}
                >
                  <span className="font-medium text-white">{connector.name}</span>
                </Button>
              );
            })}
        </div>
      </Modal>
    </>
  );
}

