'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DragDropHorizontalIcon, MoreVerticalIcon, Delete02Icon, PinIcon, Cancel01Icon } from '@hugeicons-pro/core-solid-standard';
import Switch from '@/components/ui/Switch';
import { motion, AnimatePresence, stagger } from 'motion/react';
import Button from '@/components/ui/Button';

// Animation variants for the circular background reveal
const backgroundVariants = {
    open: (width = 300) => ({
        clipPath: `circle(${width * 2}px at calc(100% - 30px) 30px)`,
        transition: {
            type: "spring",
            visualDuration: 0.2,
            bounce: 0.2,
        },
    }),
    closed: {
        clipPath: "circle(0px at calc(100% - 30px) 30px)",
        transition: {
            delay: 0.1,
            type: "spring",
            visualDuration: 0.2,
            bounce: 0.2,
        },
    },
};

// Animation variants for the settings menu container
const menuVariants = {
    open: {
        transition: {
            delayChildren: 0.05,
            staggerChildren: 0.03
        },
    },
    closed: {
        transition: {
            staggerChildren: 0.02,
            staggerDirection: -1
        },
    },
};

// Animation variants for individual menu items
const itemVariants = {
    open: {
        opacity: 1,
        transition: {
            type: "spring",
            visualDuration: 0.2,
            bounce: 0.2,
        },
    },
    closed: {
        opacity: 0,
        transition: {
            type: "spring",
            visualDuration: 0.15,
            bounce: 0,
        },
    },
};

const Card = ({
    children,
    className,
    variant = 'default',
    title,
    description,
    draggable = true,
    showTitle = true,
    showSubtitle = true,
    isFixed = false,
    onToggleTitle,
    onToggleSubtitle,
    onDelete,
    onToggleFixed
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const variantClasses = {
        default: 'bg-white/10',
        primary: 'bg-primary',
        accent: 'bg-accent',
        highlight: 'bg-highlight',
    };

    return (
        <div className={`bg-dark rounded-3xl p-6 relative overflow-hidden ${variantClasses[variant]} ${className}`}>
            {draggable && !isFixed && (
                <div className="drag-handle absolute top-0 left-0 right-0 flex justify-center items-center py-2 text-white/50 hover:text-white/80 transition-colors z-10">
                    <HugeiconsIcon icon={DragDropHorizontalIcon} className="w-5 h-5" />
                </div>
            )}
            {title && description && (
                <div className="flex w-full justify-between items-start">
                    <div className="flex flex-col gap-1 mb-4">
                        {showTitle && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                        {showSubtitle && <p className="text-sm text-white/80">{description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {isFixed && (
                            <div className="text-white/50">
                                <HugeiconsIcon icon={PinIcon} className="w-4 h-4" />
                            </div>
                        )}
                        <button
                            className="cursor-pointer transition-colors text-white/50 hover:text-white/80 p-2 rounded-full hover:bg-white/5 relative z-30"
                            type="button"
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        >
                            <HugeiconsIcon
                                icon={isSettingsOpen ? Cancel01Icon : MoreVerticalIcon}
                                className="w-5 h-5"
                            />
                        </button>
                    </div>
                </div>
            )}

            <div className={`transition-all duration-300 ${isSettingsOpen ? 'opacity-50 blur-[2px]' : ''}`}>
                {children}
            </div>

            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="absolute top-0 right-0 h-full  w-full max-w-md z-20"
                    >
                        {/* Animated circular background */}
                        <motion.div
                            variants={backgroundVariants}
                            className="absolute top-0 right-0 h-full w-full bg-dark border-2 border-white/10 rounded-tr-3xl rounded-br-3xl overflow-y-auto"
                        />

                        {/* Settings content */}
                        <motion.div
                            variants={menuVariants}
                            className="relative flex flex-col gap-4 h-full p-6"
                        >
                            {/* Header */}
                            <motion.div
                                variants={itemVariants}
                                className="mb-2"
                            >
                                <h4 className="text-white font-semibold">Settings</h4>
                            </motion.div>

                            {/* Title Toggle */}
                            <motion.div
                                variants={itemVariants}
                                className="flex justify-between items-center"
                            >
                                <div>
                                    <p className="text-white font-medium">Title</p>
                                    <p className="text-xs text-white/60">Display title on top of the widget</p>
                                </div>
                                <Switch isOn={showTitle} onToggle={onToggleTitle} />
                            </motion.div>

                            {/* Subtitle Toggle */}
                            <motion.div
                                variants={itemVariants}
                                className="flex justify-between items-center"
                            >
                                <div>
                                    <p className="text-white font-medium">Subtitle</p>
                                    <p className="text-xs text-white/60">Display subtitle description</p>
                                </div>
                                <Switch isOn={showSubtitle} onToggle={onToggleSubtitle} />
                            </motion.div>

          
                            <motion.div variants={itemVariants} className="flex items-center gap-2 justify-between pt-2 border-t border-white/10">

                                {/* Delete Button */}
                                <Button
                                    onClick={onDelete}

                                    icon={<HugeiconsIcon icon={Delete02Icon} className="w-5 h-5" />}
                                    className="w-full"
                                >
                                    Remove Widget
                                </Button>
                                {/* Fixed Position Button */}
                                <Button
                                    variant={isFixed ? "primary" : "outline"}
                                    onClick={onToggleFixed}
                                    icon={<HugeiconsIcon icon={PinIcon} className="w-5 h-5" />}
                                />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Card;