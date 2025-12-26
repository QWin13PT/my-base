'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { motion } from "motion/react";

export default function Dropdown({ trigger, items, children, className = '', variant = 'dark' }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const variantClasses = {
        dark: 'bg-dark border border-white/10',
        light: 'bg-white border border-dark/10',
    };
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
                className={`absolute right-0 mt-2 w-64 rounded-3xl shadow-lg ${variantClasses[variant]} z-50 overflow-hidden ${className}`}
            >
                {items ? (
                    <div className="p-3">
                        {items.map((item, index) => {
                            // If item has href, render as Link
                            if (item.href) {
                                return (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        onClick={() => {
                                            if (item.onClick) item.onClick();
                                            setIsOpen(false);
                                        }}
                                        className={`block w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                            item.danger 
                                                ? 'text-red-400 hover:bg-red-500/10' 
                                                : `${variant === 'dark' ? 'text-white' : 'text-black'} hover:bg-${variant}/5`
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            }
                            
                            // Otherwise render as button
                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        item.onClick();
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                        item.danger 
                                            ? 'text-red-400 hover:bg-red-500/10' 
                                            : `${variant === 'dark' ? 'text-white' : 'text-black'} hover:bg-${variant}/5`
                                    }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    children
                )}
            </motion.div>
        </div>
    );
}

