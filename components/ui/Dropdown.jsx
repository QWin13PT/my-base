'use client';

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

export default function Dropdown({ trigger, items, children, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Clone trigger element and add onClick handler
    const triggerWithClick = React.cloneElement(trigger, {
        onClick: () => setIsOpen(!isOpen),
    });

    return (
        <div className="relative" ref={dropdownRef}>
            {triggerWithClick}
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
                style={{ pointerEvents: isOpen ? "auto" : "none" }}
                className={`absolute right-0 mt-2 w-64 rounded-3xl shadow-lg bg-dark border border-white/10 z-50 overflow-hidden ${className}`}
            >
                {items ? (
                    <div className="p-3">
                        {items.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                    item.danger 
                                        ? 'text-red-400 hover:bg-red-500/10' 
                                        : 'text-white hover:bg-white/5'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    children
                )}
            </motion.div>
        </div>
    );
}

