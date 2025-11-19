import { MousePointer2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OutlineValue } from './types'

interface InteractionControlsProps {
  cursor: string
  outline: OutlineValue
  onCursorChange: (value: string) => void
  onOutlineChange: (field: string, value: string) => void
}

export const cursorTypes = [
  'default',
  'pointer',
  'text',
  'move',
  'grab',
  'grabbing',
  'not-allowed',
  'wait',
  'progress',
  'help',
  'crosshair',
  'zoom-in',
  'zoom-out'
]

export const outlineStyles = [
  'none',
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset'
]

export function InteractionControls({
  cursor,
  outline,
  onCursorChange,
  onOutlineChange
}: InteractionControlsProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <MousePointer2 size={10} />
          {t('interaction')}
        </h3>
      </div>
      <div className="space-y-2">
        <div className="space-y-0.5">
          <label className="text-[9px] text-gray-500 dark:text-gray-400">Cursor</label>
          <select
            value={cursor}
            onChange={(e) => onCursorChange(e.target.value)}
            className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            {cursorTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-[9px] text-gray-500 dark:text-gray-400">Outline</label>
          <div className="grid grid-cols-3 gap-1">
            <input
              type="number"
              value={outline.width}
              onChange={(e) => onOutlineChange('width', e.target.value)}
              className="px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
              placeholder="Width"
            />
            <select
              value={outline.style}
              onChange={(e) => onOutlineChange('style', e.target.value)}
              className="px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              {outlineStyles.map((style) => (
                <option key={style} value={style}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="color"
              value={outline.color}
              onChange={(e) => onOutlineChange('color', e.target.value)}
              className="w-full h-[22px] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
