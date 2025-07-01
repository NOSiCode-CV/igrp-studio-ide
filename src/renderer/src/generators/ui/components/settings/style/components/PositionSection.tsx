import { useState, useEffect } from 'react';
import { Move, RefreshCw, Lock, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PositionStyle, PositionType, PositionValue, SectionProps, Side } from '../types';

export function PositionSection({ onChangeStyles, styles, resetStyles }: SectionProps) {
    const { t } = useTranslation();
    const [positionStyle, setPositionStyle] = useState<PositionStyle>(
        styles.position || {
            type: 'static',
            positions: {
                top: { value: '', unit: 'px' },
                right: { value: '', unit: 'px' },
                bottom: { value: '', unit: 'px' },
                left: { value: '', unit: 'px' },
            },
            zIndex: '',
            linked: true
        }
    );

    const units = ['px', '%', 'rem', 'em', 'vw', 'vh', 'auto'];

    const positionTypes: {
        value: PositionType;
        label: string;
        description: string;
    }[] = [
            { value: 'static', label: 'Static', description: 'Default flow' },
            { value: 'relative', label: 'Relative', description: 'Relative to normal position' },
            { value: 'absolute', label: 'Absolute', description: 'Relative to parent' },
            { value: 'fixed', label: 'Fixed', description: 'Relative to viewport' },
            { value: 'sticky', label: 'Sticky', description: 'Based on scroll position' },
        ];

    const updatePositionStyle = (updates: Partial<PositionStyle>) => {
        setPositionStyle(prev => ({
            ...prev,
            ...updates,
            positions: {
                ...prev.positions,
                ...(updates.positions || {})
            }
        }));
    };

    const updatePosition = (side: Side, field: keyof PositionValue, value: string) => {
        if (positionStyle.linked) {
            const newPositions = { ...positionStyle.positions };
            Object.keys(newPositions).forEach((key) => {
                newPositions[key as Side] = {
                    ...newPositions[key as Side],
                    [field]: value,
                };
            });
            updatePositionStyle({ positions: newPositions });
        } else {
            updatePositionStyle({
                positions: {
                    ...positionStyle.positions,
                    [side]: {
                        ...positionStyle.positions[side],
                        [field]: value
                    }
                }
            });
        }
    };

    const resetPositions = () => {
        updatePositionStyle({
            type: 'static',
            positions: {
                top: { value: '', unit: 'px' },
                right: { value: '', unit: 'px' },
                bottom: { value: '', unit: 'px' },
                left: { value: '', unit: 'px' },
            },
            zIndex: '',
            linked: true
        });
    };

    useEffect(() => {
        onChangeStyles({ position: positionStyle });
    }, [positionStyle]);

    return (
        <div className="space-y-2">
            {/* Position Type */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Move size={10} />
                        {t('position')}
                    </h3>
                    <button
                        onClick={resetPositions}
                        className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Reset position"
                    >
                        <RefreshCw size={10} />
                    </button>
                </div>
                <select
                    value={positionStyle.type}
                    onChange={(e) => updatePositionStyle({ type: e.target.value as PositionType })}
                    className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                >
                    {positionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label} - {type.description}
                        </option>
                    ))}
                </select>
            </div>

            {positionStyle.type !== 'static' && (
                <>
                    {/* Offset Controls */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('offset')}
                            </h3>
                            <button
                                onClick={() => updatePositionStyle({ linked: !positionStyle.linked })}
                                className={`p-0.5 rounded ${positionStyle.linked
                                    ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                title={positionStyle.linked ? 'Unlink sides' : 'Link sides'}
                            >
                                {positionStyle.linked ? <Lock size={10} /> : <Unlock size={10} />}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                                <div key={side} className="space-y-0.5">
                                    <label className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {side}
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={positionStyle.positions[side].value}
                                            onChange={(e) => updatePosition(side, 'value', e.target.value)}
                                            className="w-[52px] px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                                            placeholder="auto"
                                        />
                                        <select
                                            value={positionStyle.positions[side].unit}
                                            onChange={(e) => updatePosition(side, 'unit', e.target.value)}
                                            className="w-12 px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                                        >
                                            {units.map((unit) => (
                                                <option key={unit} value={unit}>
                                                    {unit}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Z-Index */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('zIndex')}
                        </label>
                        <input
                            type="number"
                            value={positionStyle.zIndex}
                            onChange={(e) => updatePositionStyle({ zIndex: e.target.value })}
                            className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                            placeholder="auto"
                        />
                    </div>
                </>
            )}
        </div>
    );
}