import Switch from '@/components/ui/Switch';

const CardSettingsToggle = ({ title, description, isOn, onToggle }) => {
    return (
        <div className="flex justify-between items-center">
            <div>
                <p className="text-white font-medium">{title}</p>
                <p className="text-xs text-white/60">{description}</p>
            </div>
            <Switch isOn={isOn} onToggle={onToggle} />
        </div>
    );
};

export default CardSettingsToggle;