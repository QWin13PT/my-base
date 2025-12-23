'use client';

import * as motion from "motion/react-client";

const Switch = ({ 
    isOn = false, 
    onToggle, 
    disabled = false,
    className = "" 
}) => {
    const handleClick = () => {
        if (!disabled && onToggle) {
            onToggle();
        }
    };

    return (
        <button
            className={`relative rounded-full transition-colors ${
                isOn ? 'bg-blue-500' : 'bg-white/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
            style={{
                width: '48px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isOn ? 'flex-end' : 'flex-start',
                padding: '4px',
            }}
            onClick={handleClick}
            disabled={disabled}
            type="button"
        >
            <motion.div
                className="bg-white rounded-full"
                style={{
                    width: '16px',
                    height: '16px',
                }}
                layout
                transition={{
                    type: "spring",
                    visualDuration: 0.2,
                    bounce: 0.2,
                }}
            />
        </button>
    );
};

export default Switch;

