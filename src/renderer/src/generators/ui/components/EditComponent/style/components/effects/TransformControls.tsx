import { useState, useRef, useEffect } from 'react';
import { RotateCw, Plus, Trash2, Edit2 } from 'lucide-react';
import { TransformValue, transformTypes } from './types';

interface TransformControlsProps {
    transforms: TransformValue[];
    onTransformsChange: (transforms: TransformValue[]) => void;
}

export function TransformControls({
    transforms,
    onTransformsChange,
}: TransformControlsProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>(
        'bottom'
    );
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setEditingIndex(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        function updatePopoverPosition() {
            if (
                !buttonRef.current ||
                !popoverRef.current ||
                !containerRef.current
            )
                return;

            const buttonRect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;

            const newPosition =
                spaceBelow >= 200 || spaceBelow > spaceAbove ? 'bottom' : 'top';
            setPopoverPosition(newPosition);
        }

        if (editingIndex !== null) {
            updatePopoverPosition();
        }
    }, [editingIndex]);

    const addTransform = () => {
        onTransformsChange([
            ...transforms,
            { type: 'translate', value: '0', unit: 'px' },
        ]);
    };

    const removeTransform = (index: number) => {
        onTransformsChange(transforms.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
        }
    };

    const updateTransform = (
        index: number,
        field: keyof TransformValue,
        value: string
    ) => {
        const newTransforms = [...transforms];
        const transformType = transformTypes.find(
            (t) =>
                t.name ===
                (field === 'type' ? value : newTransforms[index].type)
        );

        if (field === 'type') {
            newTransforms[index] = {
                type: value,
                value: '0',
                unit: transformType?.units[0] || 'px',
            };
        } else {
            newTransforms[index] = { ...newTransforms[index], [field]: value };
        }

        onTransformsChange(newTransforms);
    };

    const getTransformPreview = (transform: TransformValue) => {
        return `${transform.type}(${transform.value}${transform.unit})`;
    };

    const TransformEditor = ({
        transform,
        index,
    }: {
        transform: TransformValue;
        index: number;
    }) => {
        const transformType = transformTypes.find(
            (t) => t.name === transform.type
        );

        return (
            <div
                ref={popoverRef}
                className={`absolute z-50 right-0 w-56 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${
                    popoverPosition === 'bottom'
                        ? 'top-full mt-1'
                        : 'bottom-full mb-1'
                }`}
            >
                <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                            Edit Transform {index + 1}
                        </span>
                        <button
                            onClick={() => removeTransform(index)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <Trash2 size={10} />
                        </button>
                    </div>

                    <div className="space-y-0.5">
                        <label className="text-[9px] text-gray-500">Type</label>
                        <select
                            value={transform.type}
                            onChange={(e) =>
                                updateTransform(index, 'type', e.target.value)
                            }
                            className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        >
                            {transformTypes.map((type) => (
                                <option key={type.name} value={type.name}>
                                    {type.name.charAt(0).toUpperCase() +
                                        type.name.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-0.5">
                        <label className="text-[9px] text-gray-500">
                            Value
                        </label>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={transform.value}
                                onChange={(e) =>
                                    updateTransform(
                                        index,
                                        'value',
                                        e.target.value
                                    )
                                }
                                className="flex-1 px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                                value={transform.unit}
                                onChange={(e) =>
                                    updateTransform(
                                        index,
                                        'unit',
                                        e.target.value
                                    )
                                }
                                className="w-16 px-1 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                            >
                                {transformType?.units.map((unit) => (
                                    <option key={unit} value={unit}>
                                        {unit || 'none'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <div className="text-[9px] text-gray-500 mb-1">
                            Preview
                        </div>
                        <div className="relative w-full h-12">
                            <div
                                className="absolute inset-0 m-auto w-8 h-8 bg-blue-500 rounded"
                                style={{
                                    transform: getTransformPreview(transform),
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-1.5" ref={containerRef}>
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <RotateCw size={10} />
                    Transform
                </h3>
                <button
                    onClick={addTransform}
                    className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Add transform"
                >
                    <Plus size={10} />
                </button>
            </div>

            <div className="space-y-1">
                {transforms.map((transform, index) => (
                    <div
                        key={index}
                        className="group flex items-center gap-2 p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                        <div className="relative w-6 h-6">
                            <div
                                className="absolute inset-0 m-auto w-3 h-3 bg-blue-500 rounded"
                                style={{
                                    transform: getTransformPreview(transform),
                                }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-medium text-gray-700 dark:text-gray-300">
                                {transform.type.charAt(0).toUpperCase() +
                                    transform.type.slice(1)}
                            </div>
                            <div className="text-[8px] text-gray-500 dark:text-gray-400 truncate">
                                {getTransformPreview(transform)}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="relative">
                                <button
                                    ref={buttonRef}
                                    onClick={() =>
                                        setEditingIndex(
                                            editingIndex === index
                                                ? null
                                                : index
                                        )
                                    }
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                >
                                    <Edit2 size={10} />
                                </button>
                                {editingIndex === index && (
                                    <TransformEditor
                                        transform={transform}
                                        index={index}
                                    />
                                )}
                            </div>
                            <button
                                onClick={() => removeTransform(index)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
