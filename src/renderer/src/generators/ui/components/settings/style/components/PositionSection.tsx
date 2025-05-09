import { useState } from 'react';
import { Move, RefreshCw, Lock, Unlock } from 'lucide-react';

interface PositionValue {
    value: string;
    unit: string;
}

type PositionType = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
type Side = 'top' | 'right' | 'bottom' | 'left';

export function PositionSection() {
    const [positionType, setPositionType] = useState<PositionType>('static');
    const [zIndex, setZIndex] = useState('');
    const [linked, setLinked] = useState(true);
    const [positions, setPositions] = useState<Record<Side, PositionValue>>({
        top: { value: '', unit: 'px' },
        right: { value: '', unit: 'px' },
        bottom: { value: '', unit: 'px' },
        left: { value: '', unit: 'px' },
    });

    const units = ['px', '%', 'rem', 'em', 'vw', 'vh', 'auto'];

    const positionTypes: {
        value: PositionType;
        label: string;
        description: string;
    }[] = [
        { value: 'static', label: 'Static', description: 'Default flow' },
        {
            value: 'relative',
            label: 'Relative',
            description: 'Relative to normal position',
        },
        {
            value: 'absolute',
            label: 'Absolute',
            description: 'Relative to parent',
        },
        { value: 'fixed', label: 'Fixed', description: 'Relative to viewport' },
        {
            value: 'sticky',
            label: 'Sticky',
            description: 'Based on scroll position',
        },
    ];

    const updatePosition = (
        side: Side,
        field: keyof PositionValue,
        value: string
    ) => {
        if (linked) {
            const newPositions = { ...positions };
            Object.keys(newPositions).forEach((key) => {
                newPositions[key as Side] = {
                    ...newPositions[key as Side],
                    [field]: value,
                };
            });
            setPositions(newPositions);
        } else {
            setPositions((prev) => ({
                ...prev,
                [side]: { ...prev[side], [field]: value },
            }));
        }
    };

    const resetPositions = () => {
        setPositionType('static');
        setZIndex('');
        setLinked(true);
        setPositions({
            top: { value: '', unit: 'px' },
            right: { value: '', unit: 'px' },
            bottom: { value: '', unit: 'px' },
            left: { value: '', unit: 'px' },
        });
    };

    return (
        <div className="space-y-2">
            {/* Position Type */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Move size={10} />
                        Position
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
                    value={positionType}
                    onChange={(e) =>
                        setPositionType(e.target.value as PositionType)
                    }
                    className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                >
                    {positionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label} - {type.description}
                        </option>
                    ))}
                </select>
            </div>

            {positionType !== 'static' && (
                <>
                    {/* Offset Controls */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                                Offset
                            </h3>
                            <button
                                onClick={() => setLinked(!linked)}
                                className={`p-0.5 rounded ${
                                    linked
                                        ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                title={linked ? 'Unlink sides' : 'Link sides'}
                            >
                                {linked ? (
                                    <Lock size={10} />
                                ) : (
                                    <Unlock size={10} />
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {(['top', 'right', 'bottom', 'left'] as const).map(
                                (side) => (
                                    <div key={side} className="space-y-0.5">
                                        <label className="text-[9px] text-gray-500 dark:text-gray-400 capitalize">
                                            {side}
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={positions[side].value}
                                                onChange={(e) =>
                                                    updatePosition(
                                                        side,
                                                        'value',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-[52px] px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                                                placeholder="auto"
                                            />
                                            <select
                                                value={positions[side].unit}
                                                onChange={(e) =>
                                                    updatePosition(
                                                        side,
                                                        'unit',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-12 px-1 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                                            >
                                                {units.map((unit) => (
                                                    <option
                                                        key={unit}
                                                        value={unit}
                                                    >
                                                        {unit}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Z-Index */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                            Z-Index
                        </label>
                        <input
                            type="number"
                            value={zIndex}
                            onChange={(e) => setZIndex(e.target.value)}
                            className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                            placeholder="auto"
                        />
                    </div>
                </>
            )}
        </div>
    );
}
