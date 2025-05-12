
import { useTranslation } from 'react-i18next'; 

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

  const { t } = useTranslation();
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
            <option value="row">{t('row')}</option>
            <option value="row-reverse">{t('rowReverse')}</option>
            <option value="column">{t('column')}</option>
            <option value="column-reverse">{t('columnReverse')}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Wrap</label>
          <select
            value={wrap}
            onChange={(e) => onWrapChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="nowrap">{t('noWrap')}</option>
            <option value="wrap">{t('wrap')}</option>
            <option value="wrap-reverse">{t('wrapReverse')}</option>
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
            <option value="stretch">{t('stretch')}</option>
            <option value="flex-start">{t('start')}</option>
            <option value="flex-end">{t('end')}</option>
            <option value="center">{t('center')}</option>
            <option value="baseline">{t('baseline')}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400">Justify Content</label>
          <select
            value={justifyContent}
            onChange={(e) => onJustifyContentChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            <option value="flex-start">{t('start')}</option>
            <option value="flex-end">{t('end')}</option>
            <option value="center">{t('center')}</option>
            <option value="space-between">{t('spaceBetween')}</option>
            <option value="space-around">{t('spaceAround')}</option>
            <option value="space-evenly">{t('spaceEvenly')}</option>
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
            <option value="px">{t('px')}</option>
            <option value="rem">{t('rem')}</option>
            <option value="%">{t('%')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}