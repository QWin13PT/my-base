/**
 * ConnectWallet Component
 * Wallet connection with Base network validation
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import Button from '@/components/ui/Button';


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
    <div className="relative">
      <Button 
        onClick={() => setShowConnectors(!showConnectors)}
        disabled={isPending}
        variant="primary"
        
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {/* Wallet selector dropdown */}
      {showConnectors && (
        <>
          <div className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-white shadow-lg border border-gray-200 overflow-hidden z-50">
            <div className="p-3">
              <div className="px-2 py-2 text-sm font-semibold text-gray-900 mb-2">
                Connect Wallet
              </div>
              <div className="space-y-1">
                {connectors.map((connector) => {
                  const walletName = connector.name === 'Browser Wallet' 
                    ? 'MetaMask / Trust Wallet' 
                    : connector.name;
                    
                  return (
                    <button
                      key={connector.id}
                      onClick={() => {
                        connect({ 
                          connector,
                          chainId: base.id, // Connect to Base network
                        });
                        setShowConnectors(false);
                      }}
                      className="w-full px-3 py-3 text-left text-sm hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 border border-gray-100"
                    >
                      <span className="font-medium text-gray-900">{walletName}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 px-2 py-2 text-xs text-gray-500 border-t border-gray-100">
                Only Base network addresses
              </div>
            </div>
          </div>

          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowConnectors(false)}
          />
        </>
      )}
    </div>
  );
}

