const CardSettingsDropdown = ({ title, description, value, onChange, options, className }) => {
    return (
        <div className={`flex justify-between items-center gap-2 ${className}`}>
            <div>
                <p className="text-white font-medium">{title}</p>
                <p className="text-xs text-white/60">{description}</p>
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-auto px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 cursor-pointer transition-colors hover:bg-white/10"
            >
                {options.map((option) => (
                    <option 
                        key={option.value} 
                        value={option.value}
                        className="bg-[#1A1A1A] text-white"
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CardSettingsDropdown;

