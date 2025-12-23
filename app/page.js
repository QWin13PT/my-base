'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { useUser } from '@/lib/hooks/useUser';
import { useLayouts } from '@/lib/hooks/useLayouts';
import { useWidgets } from '@/lib/hooks/useWidgets';
import { appConfig } from '@/lib/config';
import { OnboardingModal } from '@/components/shared/OnboardingModal';
import ResizableWidgetGrid from '@/components/dashboard/ResizableWidgetGrid';

export default function Home() {
  const { isConnected, balance, activeNetwork } = useWallet();
  const { user, isAuthenticated, needsOnboarding, refreshUser } = useUser();
  const { layouts, isLoading: layoutsLoading } = useLayouts();
  const { widgets, isLoading: widgetsLoading, addWidget, reorderWidgets, resetWidgets } = useWidgets(user?.id);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding modal when user needs it
  useEffect(() => {
    console.log('🔍 Home: checking onboarding', { 
      needsOnboarding, 
      showOnboarding, 
      hasUser: !!user,
      isConnected,
      isAuthenticated 
    });
    
    if (needsOnboarding && !showOnboarding) {
      console.log('✅ Triggering onboarding modal');
      setShowOnboarding(true);
    }
  }, [needsOnboarding, showOnboarding, user, isConnected, isAuthenticated]);

  const handleOnboardingComplete = async () => {
    console.log('🎉 Onboarding completed, refreshing user');
    await refreshUser();
    setShowOnboarding(false);
  };

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <OnboardingModal 
          user={user} 
          onComplete={handleOnboardingComplete}
        />
      )}

      <main className="mx-auto px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
        {!isConnected ? (
          // Not connected state
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-8">
              <div className="mb-4 text-6xl">🔐</div>
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Welcome to {appConfig.name}
              </h2>
              <p className="text-lg text-gray-600">
                Connect your wallet to get started
              </p>
            </div>
            <div className="rounded-lg bg-white p-8 shadow-sm border border-gray-200 max-w-md">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                What you can do:
              </h3>
              <ul className="space-y-3 text-left text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1">📊</span>
                  <span>Track token prices in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">💼</span>
                  <span>View your portfolio holdings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">🎨</span>
                  <span>Customize your dashboard layout</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">🔄</span>
                  <span>Quick swap tokens</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">🌐</span>
                  <span>Share your dashboard with others</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          // Connected state
          <div className="space-y-6">

            {/* User Status */}
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Connection Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Wallet:</span>
                  <span className="text-green-600">✓ Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Database:</span>
                  <span className={isAuthenticated ? 'text-green-600' : 'text-yellow-600'}>
                    {isAuthenticated ? '✓ Synced' : '⚠ Using localStorage'}
                  </span>
                </div>
                {user && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">User ID:</span>
                    <span className="text-gray-600 font-mono text-xs">
                      {user.id}
                    </span>
                  </div>
                )}
              </div>
            </div>

          

            {/* Widget Grid */}
            {widgetsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="mb-4 text-4xl">⏳</div>
                  <p className="text-gray-600">Loading your dashboard...</p>
                </div>
              </div>
            ) : (
              <ResizableWidgetGrid
                widgets={widgets}
                onWidgetsChange={reorderWidgets}
              />
            )}

            {/* Help Text */}
            <div className="rounded-lg bg-blue-50 p-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Drag, Drop & Resize Dashboard
                  </h4>
                  <p className="text-sm text-gray-600">
                    <strong>Drag:</strong> Click and drag the top icon to reorder widgets.<br />
                    <strong>Resize:</strong> Drag any corner of a widget to resize it.<br />
                    Your layout is automatically saved to localStorage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

