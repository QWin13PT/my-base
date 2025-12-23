'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { useUser } from '@/lib/hooks/useUser';
import { useLayouts } from '@/lib/hooks/useLayouts';
import { appConfig } from '@/lib/config';
import { OnboardingModal } from '@/components/shared/OnboardingModal';
import Header from '@/components/shared/Header';
import ResizableWidgetGrid from '@/components/dashboard/ResizableWidgetGrid';

export default function Home() {
  const { isConnected, balance, activeNetwork } = useWallet();
  const { user, isAuthenticated, needsOnboarding, refreshUser } = useUser();
  
  // Layout management
  const { 
    layouts, 
    activeLayout, 
    activeLayoutId,
    isLoading: layoutsLoading,
    createLayout,
    switchLayout,
    renameLayout,
    updateLayoutWidgets,
    deleteLayout,
    duplicateLayout,
  } = useLayouts(user?.id);

  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Get widgets from active layout
  const widgets = activeLayout?.widgets || [];

  // Widget management functions
  const handleAddWidget = (widget) => {
    if (!activeLayoutId) return;
    
    const { id, ...widgetWithoutId } = widget;
    const newWidget = {
      ...widgetWithoutId,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedWidgets = [...widgets, newWidget];
    updateLayoutWidgets(activeLayoutId, updatedWidgets);
  };

  const handleUpdateWidgets = (newWidgets) => {
    if (!activeLayoutId) return;
    updateLayoutWidgets(activeLayoutId, newWidgets);
  };

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
      {/* Header with Layout Management */}
      <Header
        layouts={layouts}
        activeLayoutId={activeLayoutId}
        onSwitchLayout={switchLayout}
        onCreateLayout={createLayout}
        onRenameLayout={renameLayout}
        onDeleteLayout={deleteLayout}
        onDuplicateLayout={duplicateLayout}
        onAddWidget={handleAddWidget}
      />

      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          onComplete={handleOnboardingComplete}
        />
      )}

      <main className="mx-auto px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
        <ResizableWidgetGrid
          widgets={widgets}
          onWidgetsChange={handleUpdateWidgets}
        />
      </main>
    </>
  );
}

