'use client';

import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserIcon } from '@hugeicons-pro/core-solid-standard';

const Avatar = ({ src, alt, size = 40, username, address, avatarUrl }) => {
    // Format address for display
    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };



    return (
        <div className="flex items-center gap-3">
            {/* Avatar image or circle */}
            <div 
                className="rounded-full flex items-center justify-center font-bold text-white overflow-hidden bg-white/10"
                style={{ 
                    width: size, 
                    height: size,
                }}
            >
                {avatarUrl ? (
                    <Image 
                        src={avatarUrl} 
                        alt={alt || 'User avatar'} 
                        className="w-full h-full object-cover"
                        height={size}
                        width={size}
                    />
                ) : (
                    <HugeiconsIcon icon={UserIcon} size={size * 0.6} className="text-white/50" />
                )}
            </div>
            
            {/* User info */}
            <div className="flex flex-col">
               {username && <p className="text-base font-medium text-white">{username || 'User'}</p>}
                {address && <p className="text-sm text-white/50">{formatAddress(address)}</p>}
            </div>
        </div>
    );
};

export default Avatar;