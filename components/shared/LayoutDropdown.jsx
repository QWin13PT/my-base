'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  Tick02Icon,
  MoreVerticalIcon,
  Edit02Icon,
  Delete02Icon,
  Copy01Icon,
  ArrowDown01Icon
} from '@hugeicons-pro/core-solid-standard';
import Button from '@/components/ui/Button';

export default function LayoutDropdown({
  layouts,
  activeLayoutId,
  onSwitchLayout,
  onCreateLayout,
  onRenameLayout,
  onDeleteLayout,
  onDuplicateLayout
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);

  const activeLayout = layouts.find(l => l.id === activeLayoutId);

  const handleRename = (layoutId) => {
    if (editName.trim()) {
      onRenameLayout(layoutId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  const handleCreateNew = () => {
    const newLayout = onCreateLayout();
    if (newLayout) {
      onSwitchLayout(newLayout.id);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
       variant="transparent"
       icon={<HugeiconsIcon icon={ArrowDown01Icon} className="w-4 h-4" />}
       iconPosition="right"
      >
        {activeLayout?.name || 'Main View'}
      </Button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setIsOpen(false);
                setMenuOpenId(null);
              }}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: isOpen ? 1 : 0,
                y: isOpen ? 0 : -10
              }}
              transition={{
                type: "spring",
                visualDuration: 0.2,
                bounce: 0.2,
              }}
              className="absolute top-full left-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-white/10 overflow-hidden z-50 p-2"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-xs font-semibold text-black/60 uppercase tracking-wide">
                  Your Dashboards
                </h3>
              </div>

              {/* Layouts List */}
              <div className="max-h-[400px] overflow-y-auto">
                {layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="px-4 py-3  transition-colors border-b border-white/5 last:border-b-0 hover:bg-black/5 rounded-xl"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Layout Name */}
                      {editingId === layout.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(layout.id);
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditName('');
                            }
                          }}
                          onBlur={() => handleRename(layout.id)}
                          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-black text-sm focus:outline-none focus:border-primary"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => {
                            onSwitchLayout(layout.id);
                            setIsOpen(false);
                          }}
                          className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                        >
                          <div className="flex-1">
                            <div className="text-black font-medium text-sm">
                              {layout.name}
                            </div>
                            <div className="text-black/40 text-xs mt-0.5">
                              {layout.widgets?.length || 0} widgets
                            </div>
                          </div>
                          {layout.id === activeLayoutId && (
                            <HugeiconsIcon
                              icon={Tick02Icon}
                              className="w-5 h-5 text-primary"
                            />
                          )}
                        </button>
                      )}

                      {/* Actions Menu */}
                      {editingId !== layout.id && (
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            className="!text-black/60 !border-dark/10 h-8 w-8 !p-0"
                            icon={<HugeiconsIcon icon={MoreVerticalIcon} className="w-4 h-4" />}
                            iconPosition="right"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === layout.id ? null : layout.id);
                            }}
                          />

                          {/* Actions Submenu */}
                          {menuOpenId === layout.id && (
                            <div className="absolute right-full top-0 mr-2 w-40 p-1 bg-white rounded-2xl shadow-xl border border-black/10 overflow-hidden z-10">
                              <button
                                onClick={() => {
                                  setEditingId(layout.id);
                                  setEditName(layout.name);
                                  setMenuOpenId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-black hover:bg-black/5 flex items-center gap-2 rounded-xl cursor-pointer"
                              >
                                <HugeiconsIcon icon={Edit02Icon} className="w-4 h-4" />
                                Rename
                              </button>
                              <button
                                onClick={() => {
                                  onDuplicateLayout(layout.id);
                                  setMenuOpenId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-black hover:bg-black/5 flex items-center gap-2 rounded-xl cursor-pointer"
                              >
                                <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
                                Duplicate
                              </button>
                              {layouts.length > 1 && (
                                <button
                                  onClick={() => {
                                    onDeleteLayout(layout.id);
                                    setMenuOpenId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-xl cursor-pointer"
                                >
                                  <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Create New Button */}
              <div className="px-4 py-3 border-t border-white/10">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />}
                  onClick={() => {
                    handleCreateNew();
                    setIsOpen(false);
                  }}
                  className="w-full"
                >
                  Create View
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

