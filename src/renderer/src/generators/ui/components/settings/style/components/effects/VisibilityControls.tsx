import { Eye, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VisibilityControlsProps {
    opacity: string;
    mixBlendMode: string;
    onOpacityChange: (value: string) => void;
    onBlendModeChange: (value: string) => void;
    onReset: () => void;
}

export const blendModes = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity',
];

export function VisibilityControls({
    opacity,
    mixBlendMode,
    onOpacityChange,
    onBlendModeChange,
    onReset,
}: VisibilityControlsProps) {
    const { t } = useTranslation();
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Eye size={10} />
                    {t('visibility')}
                </h3>
                <button
                    onClick={onReset}
                    className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Reset visibility"
                >
                    <RefreshCw size={10} />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('opacity')}
                    </label>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={opacity}
                            onChange={(e) => onOpacityChange(e.target.value)}
                            className="w-14 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-500">%</span>
                    </div>
                </div>
                <div className="space-y-0.5">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('blendMode')}
                    </label>
                    <select
                        value={mixBlendMode}
                        onChange={(e) => onBlendModeChange(e.target.value)}
                        className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                    >
                        {blendModes.map((mode) => (
                            <option key={mode} value={mode}>
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
