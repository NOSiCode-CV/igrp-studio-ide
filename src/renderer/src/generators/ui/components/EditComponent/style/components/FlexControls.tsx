import React from 'react';

interface FlexControlsProps {
  direction: string;
  wrap: string;
  alignItems: string;
  justifyContent: string;
  gap: string;
  onDirectionChange: (value: string) => void;
  onWrapChange: (value: string) => void;
  onAlignItemsChange: (value: string) => void;
  onJustifyContentChange: (value: string) => void;
  onGapChange: (value: string) => void;
}

export function FlexControls({
  direction,
  wrap,
  alignItems,
  justifyContent,
  gap,
  onDirectionChange,
  onWrapChange,
  onAlignItemsChange,
  onJustifyContentChange,
  onGapChange,
}: FlexControlsProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Direction</label>
          <select
            value={direction}
            onChange={(e) => onDirectionChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="row">Row</option>
            <option value="row-reverse">Row Reverse</option>
            <option value="column">Column</option>
            <option value="column-reverse">Column Reverse</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Wrap</label>
          <select
            value={wrap}
            onChange={(e) => onWrapChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="nowrap">No Wrap</option>
            <option value="wrap">Wrap</option>
            <option value="wrap-reverse">Wrap Reverse</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Align Items</label>
          <select
            value={alignItems}
            onChange={(e) => onAlignItemsChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="stretch">Stretch</option>
            <option value="flex-start">Start</option>
            <option value="flex-end">End</option>
            <option value="center">Center</option>
            <option value="baseline">Baseline</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Justify Content</label>
          <select
            value={justifyContent}
            onChange={(e) => onJustifyContentChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="flex-start">Start</option>
            <option value="flex-end">End</option>
            <option value="center">Center</option>
            <option value="space-between">Space Between</option>
            <option value="space-around">Space Around</option>
            <option value="space-evenly">Space Evenly</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 dark:text-gray-400">Gap</label>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={gap}
            onChange={(e) => onGapChange(e.target.value)}
            className="flex-1 px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          <select
            className="w-16 px-1 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="%">%</option>
          </select>
        </div>
      </div>
    </div>
  );
}