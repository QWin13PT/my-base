'use client';

import { useState } from "react";
import { appConfig } from "@/lib/config";
import { ConnectWallet } from "./ConnectWallet";
import WidgetsModal from "./WidgetsModal";
import { useWallet } from "@/lib/hooks/useWallet";
import { useUser } from "@/lib/hooks/useUser";
import { useWidgets } from "@/lib/hooks/useWidgets";
import { useAccount } from "wagmi";
import Avatar from "@/components/ui/Avatar";
import SearchBar from "@/components/form/SearchBar";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowDown01Icon } from "@hugeicons-pro/core-solid-standard";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

const Header = () => {
  const { activeNetwork, disconnect, formatAddress } = useWallet();
  const { user } = useUser();
  const { address, isConnected } = useAccount();
  const { widgets, addWidget } = useWidgets(user?.id);
  const [isWidgetsModalOpen, setIsWidgetsModalOpen] = useState(false);

  const handleOpenWidgetsModal = () => {
    setIsWidgetsModalOpen(true);
  };

  const handleCloseWidgetsModal = () => {
    setIsWidgetsModalOpen(false);
  };

  const handleAddWidget = (widget) => {
    // Add the selected widget to the dashboard
    addWidget(widget);
    // Optionally close modal after adding (or keep it open for multiple additions)
    // setIsWidgetsModalOpen(false);
  };

  const handleLogout = () => {
    disconnect();
  };

  // Dropdown items for avatar menu
  const avatarMenuItems = [
    {
      label: (
        <div className="flex flex-col gap-1 py-1">
          <span className="font-semibold text-base text-white">
            {user?.username || 'User'}
          </span>
          <span className="text-xs text-white/50">
            {formatAddress(address)}
          </span>
        </div>
      ),
      onClick: () => { }, // Info display, no action
    },
    {
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <header className="bg-dark border-b border-white/10">
      <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between gap-16">


        <div className="flex items-center justify-between flex-1">
          <div>
            <h1 className={`text-3xl font-bold text-white lowercase ${outfit.className} select-none `}>
              {appConfig.name}
            </h1>
          </div>
          {/* Search bar and add button */}
          <div className="flex items-center gap-4">
            <div>
              <Button variant="transparent" className="text-xl" icon={<HugeiconsIcon icon={ArrowDown01Icon} className="w-5 h-5" />}>
                Dashboard
              </Button>
            </div>
            <div className="flex-1 w-80">
              <SearchBar placeholder="Search" />
            </div>
            <Button
              variant="primary"
              size="sm"
              className="h-[44px] w-[44px]"
              onClick={handleOpenWidgetsModal}
            >
              <HugeiconsIcon icon={Add01Icon} className="w-5 h-5" />
            </Button>
          </div>

          {/* Wallet and avatar */}
          <div className="flex items-center gap-4">
            {/* Show avatar when connected, connect wallet button when not */}
            {isConnected && address ? (
              <Dropdown
                className="bg-white "
                trigger={
                  <div className="cursor-pointer">
                    <Avatar
                      avatarUrl={user?.avatar_url}
                      size={48}
                    />
                  </div>
                }
                items={avatarMenuItems}
              />
            ) : (
              <ConnectWallet />
            )}
          </div>
        </div>
      </div>

      {/* Widgets Modal */}
      <WidgetsModal
        isOpen={isWidgetsModalOpen}
        onClose={handleCloseWidgetsModal}
        onAddWidget={handleAddWidget}
      />
    </header>
  );
};

export default Header;