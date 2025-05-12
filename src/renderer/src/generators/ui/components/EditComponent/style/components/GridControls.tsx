import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [direction, setDirection] = React.useState('row');
  const [dense, setDense] = React.useState(false);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">{t('direction')}</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="row">{t('row')}</option>
            <option value="column">{t('column')}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">{t('densePacking')}</label>
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
          <label className="text-[10px] text-gray-500 dark:text-gray-400">{t('columns')}</label>
          <input
            type="number"
            min="1"
            value={columns}
            onChange={(e) => onColumnsChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">{t('rows')}</label>
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
          <label className="text-[10px] text-gray-500 dark:text-gray-400">{t('alignItems')}</label>
          <select
            value={alignItems}
            onChange={(e) => onAlignItemsChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="start">{t('start')}</option>
            <option value="end">{t('end')}</option>
            <option value="center">{t('center')}</option>
            <option value="stretch">{t('stretch')}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">{t('justifyItems')}</label>
          <select
            value={justifyItems}
            onChange={(e) => onJustifyItemsChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="start">{t('start')}</option>
            <option value="end">{t('end')}</option>
            <option value="center">{t('center')}</option>
            <option value="stretch">{t('stretch')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 dark:text-gray-400">{t('gap')}</label>
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
            <option value="px">{t('px')}</option>
            <option value="rem">{t('rem')}</option>
            <option value="%">{t('%')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}