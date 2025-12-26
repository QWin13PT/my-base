import { motion } from 'motion/react';
import Image from 'next/image';

const Button = ({ children, onClick, className = '', variant = 'default', size = 'md', rounded = 'full', disabled = false, icon = null, iconPosition = 'right', loading = false, image = null }) => {
    const variantClasses = {
        default: 'bg-white text-black hover:bg-gray-100',
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        accent: 'bg-accent text-white hover:opacity-90',
        highlight: 'bg-highlight text-white hover:opacity-90',
        outline: 'bg-transparent text-white border-2 border-white/10 hover:border-white/20',
        transparent: 'bg-transparent text-white hover:bg-white/10',
    };
    const sizeClasses = {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
    };
    const roundedClasses = {
        full: 'rounded-full',
        none: 'rounded-none',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
    };
    return (
        <motion.button 
            className={`cursor-pointer transition-all rounded-full font-medium flex items-center ${image ? 'justify-start' : 'justify-center'} gap-2  ${variantClasses[variant]} ${className} ${sizeClasses[size]} ${roundedClasses[rounded]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
            onClick={onClick}
            disabled={disabled}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            transition={{ duration: 0.1 }}
        >
            {image && (
                <Image 
                    src={image} 
                    alt="" 
                    width={24} 
                    height={24} 
                    className="w-6 h-6 object-contain mr-2 rounded"
                />
            )}
            {icon && iconPosition === 'left' && icon}
            {loading ? <span className="animate-spin">Loading...</span> : children}
            {icon && iconPosition === 'right' && icon}
        </motion.button>
    );
};

export default Button;