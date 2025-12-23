import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Cancel01Icon } from '@hugeicons-pro/core-solid-standard';

const SearchBar = ({ placeholder = 'Search', value, onChange, className = '' }) => {
    const handleClear = () => {
        onChange({ target: { value: '' } });
    };

    return (
        <div className="relative w-full">
            <HugeiconsIcon icon={Search01Icon} className="w-5 h-5 text-white/50 absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input 
                type="text" 
                placeholder={placeholder} 
                value={value} 
                onChange={onChange} 
                className={`bg-white/10 rounded-full  pl-10 pr-10 py-2.5 min-w-64 w-full focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${className}`} 
            />
            {value && (
                <button 
                    onClick={handleClear}
                    className="absolute right-3 text-white/50 hover:text-white/80 transition-colors"
                    aria-label="Clear search"
                >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default SearchBar;