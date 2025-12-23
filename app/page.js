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
    if (needsOnboarding && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [needsOnboarding, showOnboarding]);

  const handleOnboardingComplete = async () => {
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
 
          <div className="space-y-6">

            {/* Widget Grid - Show immediately, widgets handle their own loading */}
            <ResizableWidgetGrid
              widgets={widgets}
              onWidgetsChange={reorderWidgets}
            />

            {/* Help Text */}
            {!widgetsLoading && widgets.length === 0 && (
              <div className="rounded-lg bg-blue-50 p-6 border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">👋</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Welcome to Your Dashboard
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Get started by adding widgets to your dashboard. Click the <strong>+</strong> button in the header to browse available widgets.
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Tip:</strong> You can drag, resize, and customize each widget to create your perfect dashboard.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

