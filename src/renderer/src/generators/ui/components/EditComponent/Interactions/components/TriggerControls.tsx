import { useState, useRef, useEffect } from 'react';
import { BoxSelect, Lock, Unlock, Plus, Trash2, Edit2 } from 'lucide-react';
import { ShadowValue } from '../../style/components/effects/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Button } from '@renderer/components/ui/button';

interface TriggerControlsProps {
    shadows: ShadowValue[];
    linkedShadow: boolean;
    interactions: any;
    onShadowsChange: (shadows: ShadowValue[]) => void;
    onLinkedShadowChange: (linked: boolean) => void;
}

export function TriggerControls({
    shadows,
    linkedShadow,
    interactions,
    onShadowsChange,
    onLinkedShadowChange,
}: TriggerControlsProps) {
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
            const containerRect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;

            // Check if there's more space below or above
            const newPosition =
                spaceBelow >= 200 || spaceBelow > spaceAbove ? 'bottom' : 'top';
            setPopoverPosition(newPosition);
        }

        if (editingIndex !== null) {
            updatePopoverPosition();
        }
    }, [editingIndex]);

    const addShadow = () => {
        const newShadow = {
            x: '0',
            y: '4',
            blur: '8',
            spread: '0',
            color: '#00000040',
            inset: false,
        };
        onShadowsChange([...shadows, newShadow]);
    };

    const removeShadow = (index: number) => {
        onShadowsChange(shadows.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
        }
    };

    const updateShadow = (
        index: number,
        field: keyof ShadowValue,
        value: any
    ) => {
        const newShadows = [...shadows];
        newShadows[index] = { ...newShadows[index], [field]: value };

        if (linkedShadow && (field === 'x' || field === 'y')) {
            newShadows[index] = {
                ...newShadows[index],
                x: field === 'x' ? value : newShadows[index].x,
                y: field === 'y' ? value : newShadows[index].y,
            };
        }

        onShadowsChange(newShadows);
    };

    const getShadowPreview = (shadow: ShadowValue) => {
        return `${shadow.inset ? 'inset ' : ''}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`;
    };

    const AddDropdown = () => {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={'secondary'} size={'sm'}>
                    <Plus size={10} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-60">
                    {Object.keys(interactions).map((int, index) => {
                        return (
                            <DropdownMenuItem key={index} onClick={addShadow}>
                                {int}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const ShadowEditor = ({
        shadow,
        index,
    }: {
        shadow: ShadowValue;
        index: number;
    }) => (
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
                        Edit Shadow {index + 1}
                    </span>
                    <button
                        onClick={() => removeShadow(index)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
                <div className="flex items-center">
                    <label className="flex items-center gap-1.5">
                        <input
                            type="checkbox"
                            checked={shadow.inset}
                            onChange={(e) =>
                                updateShadow(index, 'inset', e.target.checked)
                            }
                            className="w-3 h-3 rounded text-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-[9px] text-gray-500">
                            Inside shadow
                        </span>
                    </label>
                </div>
                <div className="grid grid-cols-2 gap-1">
                    <div className="space-y-0.5">
                        <label className="text-[9px] text-gray-500">
                            Offset X
                        </label>
                        <input
                            type="number"
                            value={shadow.x}
                            onChange={(e) =>
                                updateShadow(index, 'x', e.target.value)
                            }
                            className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[9px] text-gray-500">
                            Offset Y
                        </label>
                        <input
                            type="number"
                            value={shadow.y}
                            onChange={(e) =>
                                updateShadow(index, 'y', e.target.value)
                            }
                            className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                    <div className="space-y-0.5">
                        <label className="text-[9px] text-gray-500">Blur</label>
                        <input
                            type="number"
                            min="0"
                            value={shadow.blur}
                            onChange={(e) =>
                                updateShadow(index, 'blur', e.target.value)
                            }
                            className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[9px] text-gray-500">
                            Spread
                        </label>
                        <input
                            type="number"
                            value={shadow.spread}
                            onChange={(e) =>
                                updateShadow(index, 'spread', e.target.value)
                            }
                            className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="space-y-0.5">
                    <label className="text-[9px] text-gray-500">Color</label>
                    <div className="flex gap-1">
                        <input
                            type="color"
                            value={shadow.color}
                            onChange={(e) =>
                                updateShadow(index, 'color', e.target.value)
                            }
                            className="w-8 h-[22px] rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={shadow.color}
                            onChange={(e) =>
                                updateShadow(index, 'color', e.target.value)
                            }
                            className="flex-1 px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-1.5" ref={containerRef}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <BoxSelect size={16} />
                    Trigger Element
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onLinkedShadowChange(!linkedShadow)}
                        className={`p-0.5 rounded ${
                            linkedShadow
                                ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={
                            linkedShadow
                                ? 'Unlink shadow values'
                                : 'Link shadow values'
                        }
                    >
                        {linkedShadow ? (
                            <Lock size={10} />
                        ) : (
                            <Unlock size={10} />
                        )}
                    </button>
                    {/*  <button
                        onClick={addShadow}
                        className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Add shadow"
                    >
                        <Plus size={10} />
                    </button> */}
                    <AddDropdown />
                </div>
            </div>

            <div className="space-y-1">
                {shadows.map((shadow, index) => (
                    <div
                        key={index}
                        className="group flex items-center gap-2 p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                        <div
                            className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700"
                            style={{ boxShadow: getShadowPreview(shadow) }}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-medium text-gray-700 dark:text-gray-300">
                                {shadow.inset ? 'Inside' : 'Outside'} Shadow{' '}
                                {index + 1}
                            </div>
                            <div className="text-[8px] text-gray-500 dark:text-gray-400 truncate">
                                {getShadowPreview(shadow)}
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
                                    <ShadowEditor
                                        shadow={shadow}
                                        index={index}
                                    />
                                )}
                            </div>
                            <button
                                onClick={() => removeShadow(index)}
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
