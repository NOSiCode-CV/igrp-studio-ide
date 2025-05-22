import React, { useState } from 'react';
import {
    Square,
    LayoutGrid,
    AlignCenter,
    XSquare,
    ChevronDown,
    Plus,
} from 'lucide-react';
import { FlexControls } from './FlexControls';
import { GridControls } from './GridControls';
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';

export function LayoutSection() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDisplay, setSelectedDisplay] = useState('Block');
    // Flex controls
    const [flexDirection, setFlexDirection] = useState('row');
    const [flexWrap, setFlexWrap] = useState('nowrap');
    const [alignItems, setAlignItems] = useState('stretch');
    const [justifyContent, setJustifyContent] = useState('flex-start');
    const [gap, setGap] = useState('0');
    // Grid controls
    const [gridColumns, setGridColumns] = useState('1');
    const [gridRows, setGridRows] = useState('1');
    const [gridGap, setGridGap] = useState('0');
    const [justifyItems, setJustifyItems] = useState('start');
    const [alignItems2, setAlignItems2] = useState('start');

    const mainOptions = [
        { value: 'Block', label: 'Block', icon: <Square size={14} /> },
        { value: 'Flex', label: 'Flex', icon: <AlignCenter size={14} /> },
        { value: 'Grid', label: 'Grid', icon: <LayoutGrid size={14} /> },
        { value: 'None', label: 'None', icon: <XSquare size={14} /> },
    ];

    const additionalOptions = [
        {
            value: 'Inline-block',
            label: 'Inline-block',
            icon: <Square size={14} />,
        },
        {
            value: 'Inline-flex',
            label: 'Inline-flex',
            icon: <AlignCenter size={14} />,
        },
        {
            value: 'Inline-grid',
            label: 'Inline-grid',
            icon: <LayoutGrid size={14} />,
        },
        { value: 'Inline', label: 'Inline', icon: <AlignCenter size={14} /> },
    ];

    const allOptions = [...mainOptions, ...additionalOptions];
    const selectedOption = allOptions.find(
        (opt) => opt.value === selectedDisplay
    );
    const isAdditionalOptionSelected = additionalOptions.some(
        (opt) => opt.value === selectedDisplay
    );
    const isFlexDisplay =
        selectedDisplay === 'Flex' || selectedDisplay === 'Inline-flex';
    const isGridDisplay =
        selectedDisplay === 'Grid' || selectedDisplay === 'Inline-grid';

    const handleClickOutside = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="space-y-0.5 relative">
                <label className="text-[10px] text-gray-500 dark:text-gray-400">
                    Display
                </label>
                <Tabs defaultValue="Block">
                    <TabsList className="grid w-full grid-cols-4">
                        {mainOptions.map((option) => (
                            <TabsTrigger
                                key={option.value}
                                value={option.value}
                                onClick={() => setSelectedDisplay(option.value)}
                                className="flex flex-1 items-center justify-center text-xs"
                            >
                                <div
                                    className={`mb-0.5 transition-transform duration-200 ${selectedDisplay === option.value ? 'scale-110' : ''}`}
                                >
                                    {option.icon}
                                </div>
                                <span className="font-medium">
                                    {option.label}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="relative mt-0.5">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`
              w-full flex items-center justify-between px-2 py-1.5 text-[10px] rounded
              ${
                  isAdditionalOptionSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }
              hover:bg-opacity-90 transition-all duration-200
              ${isOpen ? 'ring-2 ring-blue-500' : ''}
            `}
                        >
                            <div className="flex items-center gap-1.5">
                                {isAdditionalOptionSelected ? (
                                    selectedOption?.icon
                                ) : (
                                    <Plus
                                        size={14}
                                        className="text-gray-500 dark:text-gray-400"
                                    />
                                )}
                                <span className="font-medium">
                                    {isAdditionalOptionSelected
                                        ? selectedOption?.label
                                        : 'More display options'}
                                </span>
                            </div>
                            <ChevronDown
                                size={14}
                                className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {isOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={handleClickOutside}
                                />
                                <div className="absolute z-20 w-full mt-0.5 py-0.5 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                                    {additionalOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSelectedDisplay(
                                                    option.value
                                                );
                                                setIsOpen(false);
                                            }}
                                            className={`
                      w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px]
                      transition-colors duration-200
                      ${
                          selectedDisplay === option.value
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                                        >
                                            <div
                                                className={`transition-transform duration-200 ${selectedDisplay === option.value ? 'scale-110' : ''}`}
                                            >
                                                {option.icon}
                                            </div>
                                            <span className="font-medium">
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    
                    {isFlexDisplay && (
                        <div className="mt-3">
                            <FlexControls
                                direction={flexDirection}
                                wrap={flexWrap}
                                alignItems={alignItems}
                                justifyContent={justifyContent}
                                gap={gap}
                                onDirectionChange={setFlexDirection}
                                onWrapChange={setFlexWrap}
                                onAlignItemsChange={setAlignItems}
                                onJustifyContentChange={setJustifyContent}
                                onGapChange={setGap}
                            />
                        </div>
                    )}

                    {isGridDisplay && (
                        <div className="mt-3">
                            <GridControls
                                columns={gridColumns}
                                rows={gridRows}
                                justifyItems={justifyItems}
                                alignItems={alignItems2}
                                gap={gridGap}
                                onColumnsChange={setGridColumns}
                                onRowsChange={setGridRows}
                                onJustifyItemsChange={setJustifyItems}
                                onAlignItemsChange={setAlignItems2}
                                onGapChange={setGridGap}
                            />
                        </div>
                    )}
                </Tabs>
            </div>
        </div>
    );
}
