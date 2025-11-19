import React, { useState, useEffect } from 'react'
import { ArrowRight, ArrowDown, Lock, Unlock, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SectionProps, SizeSytle, SizeValue } from '../types'

export function SizeSection({ onChangeStyles, styles }: SectionProps) {
  const { t } = useTranslation()
  const [sizeState, setSizeState] = useState<SizeSytle>(
    styles.size || {
      width: { value: '', unit: 'px' },
      height: { value: '', unit: 'px' },
      minWidth: { value: '', unit: 'px' },
      maxWidth: { value: '', unit: 'px' },
      minHeight: { value: '', unit: 'px' },
      maxHeight: { value: '', unit: 'px' },
      aspectRatio: '',
      overflowX: 'visible',
      overflowY: 'visible',
      aspectRatioLocked: false
    }
  )

  const units = ['px', '%', 'rem', 'em', 'vw', 'vh', 'auto']
  const commonAspectRatios = [
    { label: 'Square (1:1)', value: '1/1' },
    { label: '16:9', value: '16/9' },
    { label: '4:3', value: '4/3' },
    { label: '3:2', value: '3/2' },
    { label: '21:9', value: '21/9' }
  ]

  const overflowOptions = [
    { value: 'visible', label: 'Visible' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'clip', label: 'Clip' },
    { value: 'scroll', label: 'Scroll' },
    { value: 'auto', label: 'Auto' }
  ]

  // Update parent whenever state changes
  useEffect(() => {
    onChangeStyles({ size: sizeState })
  }, [sizeState])

  const handleWidthChange = (width: SizeValue) => {
    setSizeState((prev) => {
      const newState = { ...prev, width }
      if (prev.aspectRatioLocked && prev.aspectRatio && width.value) {
        const [w, h] = prev.aspectRatio.split('/').map(Number)
        const newHeightValue = ((Number(width.value) * h) / w).toString()
        newState.height = { ...prev.height, value: newHeightValue }
      }
      return newState
    })
  }

  const handleHeightChange = (height: SizeValue) => {
    setSizeState((prev) => {
      const newState = { ...prev, height }
      if (prev.aspectRatioLocked && prev.aspectRatio && height.value) {
        const [w, h] = prev.aspectRatio.split('/').map(Number)
        const newWidthValue = ((Number(height.value) * w) / h).toString()
        newState.width = { ...prev.width, value: newWidthValue }
      }
      return newState
    })
  }

  const toggleAspectRatioLock = () => {
    setSizeState((prev) => ({
      ...prev,
      aspectRatioLocked: !prev.aspectRatioLocked
    }))
  }

  const resetDimensions = () => {
    setSizeState((prev) => ({
      ...prev,
      width: { value: '', unit: 'px' },
      height: { value: '', unit: 'px' }
    }))
  }

  const SizeInput = ({
    value,
    onChange,
    label,
    icon
  }: {
    value: SizeValue
    onChange: (value: SizeValue) => void
    label: string
    icon?: React.ReactNode
  }) => (
    <div className="space-y-0.5">
      <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
        {icon}
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className="w-[52px] px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          placeholder="auto"
        />
        <select
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value })}
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
  )

  return (
    <div className="space-y-2">
      {/* Main dimensions */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">Dimensions</h3>
          <button
            onClick={resetDimensions}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Reset dimensions"
          >
            <RefreshCw size={10} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SizeInput
            value={sizeState.width}
            onChange={handleWidthChange}
            label="Width"
            icon={<ArrowRight size={9} />}
          />
          <SizeInput
            value={sizeState.height}
            onChange={handleHeightChange}
            label="Height"
            icon={<ArrowDown size={9} />}
          />
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('aspectRatio')}
          </h3>
          <button
            onClick={toggleAspectRatioLock}
            className={`p-0.5 rounded ${
              sizeState.aspectRatioLocked
                ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={sizeState.aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          >
            {sizeState.aspectRatioLocked ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
        </div>
        <select
          value={sizeState.aspectRatio}
          onChange={(e) =>
            setSizeState((prev) => ({
              ...prev,
              aspectRatio: e.target.value
            }))
          }
          className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          disabled={!sizeState.aspectRatioLocked}
        >
          <option value="">{t('custom')}</option>
          {commonAspectRatios.map((ratio) => (
            <option key={ratio.value} value={ratio.value}>
              {ratio.label}
            </option>
          ))}
        </select>
      </div>

      {/* Overflow */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">Overflow</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <label className="text-xs text-gray-500 dark:text-gray-400">Horizontal</label>
            <select
              value={sizeState.overflowX}
              onChange={(e) =>
                setSizeState((prev) => ({
                  ...prev,
                  overflowX: e.target.value
                }))
              }
              className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              {overflowOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-0.5">
            <label className="text-xs text-gray-500 dark:text-gray-400">Vertical</label>
            <select
              value={sizeState.overflowY}
              onChange={(e) =>
                setSizeState((prev) => ({
                  ...prev,
                  overflowY: e.target.value
                }))
              }
              className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              {overflowOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Min/Max Constraints */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">Constraints</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <SizeInput
              value={sizeState.minWidth}
              onChange={(minWidth) => setSizeState((prev) => ({ ...prev, minWidth }))}
              label="Min Width"
            />
            <SizeInput
              value={sizeState.maxWidth}
              onChange={(maxWidth) => setSizeState((prev) => ({ ...prev, maxWidth }))}
              label="Max Width"
            />
          </div>
          <div className="space-y-1.5">
            <SizeInput
              value={sizeState.minHeight}
              onChange={(minHeight) => setSizeState((prev) => ({ ...prev, minHeight }))}
              label="Min Height"
            />
            <SizeInput
              value={sizeState.maxHeight}
              onChange={(maxHeight) => setSizeState((prev) => ({ ...prev, maxHeight }))}
              label="Max Height"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
