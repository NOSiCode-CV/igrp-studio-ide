import React from 'react';

interface GridControlsProps {
  columns: string;
  rows: string;
  justifyItems: string;
  alignItems: string;
  gap: string;
  onColumnsChange: (value: string) => void;
  onRowsChange: (value: string) => void;
  onJustifyItemsChange: (value: string) => void;
  onAlignItemsChange: (value: string) => void;
  onGapChange: (value: string) => void;
}

export function GridControls({
  columns,
  rows,
  justifyItems,
  alignItems,
  gap,
  onColumnsChange,
  onRowsChange,
  onJustifyItemsChange,
  onAlignItemsChange,
  onGapChange,
}: GridControlsProps) {
  const [direction, setDirection] = React.useState('row');
  const [dense, setDense] = React.useState(false);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="row">Row</option>
            <option value="column">Column</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Dense Packing</label>
          <div className="flex items-center h-[26px] px-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dense}
                onChange={(e) => setDense(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-500 peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Columns</label>
          <input
            type="number"
            min="1"
            value={columns}
            onChange={(e) => onColumnsChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Rows</label>
          <input
            type="number"
            min="1"
            value={rows}
            onChange={(e) => onRowsChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          />
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
            <option value="start">Start</option>
            <option value="end">End</option>
            <option value="center">Center</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Justify Items</label>
          <select
            value={justifyItems}
            onChange={(e) => onJustifyItemsChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="start">Start</option>
            <option value="end">End</option>
            <option value="center">Center</option>
            <option value="stretch">Stretch</option>
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