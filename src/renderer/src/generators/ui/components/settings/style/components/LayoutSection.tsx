import React, { useEffect } from 'react'
import { Square, LayoutGrid, AlignCenter, XSquare, ChevronDown, Plus } from 'lucide-react'
import { FlexControls } from './FlexControls'
import { GridControls } from './GridControls'
import {
  IGRPTabsPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { LayoutStyle, SectionProps } from '../types'

export function LayoutSection({ onChangeStyles, styles }: SectionProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [layoutStyle, setLayoutStyle] = React.useState<LayoutStyle>(
    styles.layout || {
      type: 'block',
      flex: {
        direction: 'row',
        wrap: 'nowrap',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        gap: '2'
      },
      grid: {
        templateColumns: '4',
        templateRows: '1',
        gap: '2',
        justifyItems: 'stretch',
        alignItems: 'start',
        direction: 'row',
        dense: false
      },
      block: {}
    }
  )

  const updateLayoutStyle = (updates: Partial<LayoutStyle>) => {
    setLayoutStyle((prev) => {
      // Create a deep merge of the previous state and updates
      const merged = {
        ...prev,
        ...updates,
        flex: {
          ...prev.flex,
          ...(updates.flex || {})
        },
        grid: {
          ...prev.grid,
          ...(updates.grid || {})
        },
        block: {
          ...prev.block,
          ...(updates.block || {})
        }
      }
      return merged as LayoutStyle
    })
  }

  // Layout type options
  const layoutTypes = {
    main: [
      { value: 'block', label: 'Block', icon: <Square size={14} /> },
      { value: 'flex', label: 'Flex', icon: <AlignCenter size={14} /> },
      { value: 'grid', label: 'Grid', icon: <LayoutGrid size={14} /> },
      { value: 'none', label: 'None', icon: <XSquare size={14} /> }
    ],
    additional: [
      {
        value: 'inline-block',
        label: 'Inline-block',
        icon: <Square size={14} />
      },
      {
        value: 'inline-flex',
        label: 'Inline-flex',
        icon: <AlignCenter size={14} />
      },
      {
        value: 'inline-grid',
        label: 'Inline-grid',
        icon: <LayoutGrid size={14} />
      },
      {
        value: 'inline',
        label: 'Inline',
        icon: <AlignCenter size={14} />
      }
    ]
  }

  const allOptions = [...layoutTypes.main, ...layoutTypes.additional]
  const selectedOption = allOptions.find((opt) => opt.value === layoutStyle.type)
  const isAdditionalOption = layoutTypes.additional.some((opt) => opt.value === layoutStyle.type)
  const isFlex = layoutStyle.type.includes('flex')
  const isGrid = layoutStyle.type.includes('grid')
  const isBlock = layoutStyle.type.includes('block') && !isAdditionalOption

  const handleDisplayChange = (value: string) => {
    updateLayoutStyle({ type: value as LayoutStyle['type'] })
  }

  useEffect(() => {
    onChangeStyles({ layout: layoutStyle })
  }, [layoutStyle])

  const renderBlockControls = () => (
    <div className="p-2 rounded-md text-center">
      <p className="text-xs text-muted-foreground mb-2">
        Block display properties will appear here
      </p>
    </div>
  )

  const renderFlexControls = () => (
    <div className="mt-3">
      <FlexControls
        direction={layoutStyle.flex?.direction || 'row'}
        wrap={layoutStyle.flex?.wrap || 'nowrap'}
        alignItems={layoutStyle.flex?.alignItems || 'stretch'}
        justifyContent={layoutStyle.flex?.justifyContent || 'flex-start'}
        gap={layoutStyle.flex?.gap || '0'}
        onDirectionChange={(value) =>
          updateLayoutStyle({
            flex: { ...layoutStyle.flex, direction: value }
          })
        }
        onWrapChange={(value) =>
          updateLayoutStyle({
            flex: { ...layoutStyle.flex, wrap: value }
          })
        }
        onAlignItemsChange={(value) =>
          updateLayoutStyle({
            flex: { ...layoutStyle.flex, alignItems: value }
          })
        }
        onJustifyContentChange={(value) =>
          updateLayoutStyle({
            flex: { ...layoutStyle.flex, justifyContent: value }
          })
        }
        onGapChange={(value) =>
          updateLayoutStyle({
            flex: { ...layoutStyle.flex, gap: value }
          })
        }
      />
    </div>
  )

  const renderGridControls = () => (
    <div className="mt-3">
      <GridControls
        columns={layoutStyle.grid?.templateColumns || '1'}
        rows={layoutStyle.grid?.templateRows || '1'}
        justifyItems={layoutStyle.grid?.justifyItems || 'start'}
        alignItems={layoutStyle.grid?.alignItems || 'start'}
        gap={layoutStyle.grid?.gap || '0'}
        direction={layoutStyle.grid?.direction || 'row'}
        dense={layoutStyle.grid?.dense || false}
        onColumnsChange={(value) =>
          updateLayoutStyle({
            grid: { ...layoutStyle.grid, templateColumns: value }
          })
        }
        onRowsChange={(value) =>
          updateLayoutStyle({
            grid: { ...layoutStyle.grid, templateRows: value }
          })
        }
        onJustifyItemsChange={(value) =>
          updateLayoutStyle({
            grid: { ...layoutStyle.grid, justifyItems: value }
          })
        }
        onAlignItemsChange={(value) =>
          updateLayoutStyle({
            grid: { ...layoutStyle.grid, alignItems: value }
          })
        }
        onGapChange={(value) =>
          updateLayoutStyle({
            grid: { ...layoutStyle.grid, gap: value }
          })
        }
        onDirectionChange={(value) =>
          updateLayoutStyle({
            grid: { ...layoutStyle.grid, direction: value }
          })
        }
        onDenseChange={(value) =>
          updateLayoutStyle({
            grid: { ...layoutStyle.grid, dense: value }
          })
        }
      />
    </div>
  )

  return (
    <div className="space-y-2">
      <div className="space-y-0.5 relative">
        <label className="text-xs text-gray-500 dark:text-gray-400">Display</label>

        <IGRPTabsPrimitive defaultValue="block" value={layoutStyle.type}>
          <IGRPTabsListPrimitive className="grid w-full grid-cols-4">
            {layoutTypes.main.map((option) => (
              <IGRPTabsTriggerPrimitive
                key={option.value}
                value={option.value}
                onClick={() => handleDisplayChange(option.value)}
                className="flex flex-1 items-center justify-center text-xs"
              >
                <div
                  className={`mb-0.5 transition-transform duration-200 ${
                    layoutStyle.type === option.value ? 'scale-110' : ''
                  }`}
                >
                  {option.icon}
                </div>
                <span className="font-medium">{option.label}</span>
              </IGRPTabsTriggerPrimitive>
            ))}
          </IGRPTabsListPrimitive>

          <div className="relative mt-0.5">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`
                                w-full flex items-center justify-between px-2 py-1.5 text-xs rounded
                                ${
                                  isAdditionalOption
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }
                                hover:bg-opacity-90 transition-all duration-200
                                ${isOpen ? 'ring-2 ring-blue-500' : ''}
                            `}
            >
              <div className="flex items-center gap-1.5">
                {isAdditionalOption ? (
                  selectedOption?.icon
                ) : (
                  <Plus size={14} className="text-gray-500 dark:text-gray-400" />
                )}
                <span className="font-medium">
                  {isAdditionalOption ? selectedOption?.label : 'More display options'}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`transform transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                <div className="absolute z-20 w-full mt-0.5 py-0.5 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                  {layoutTypes.additional.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleDisplayChange(option.value)
                        setIsOpen(false)
                      }}
                      className={`
                                                w-full flex items-center gap-1.5 px-2 py-1.5 text-xs
                                                transition-colors duration-200
                                                ${
                                                  layoutStyle.type === option.value
                                                    ? 'bg-blue-500 text-white'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }
                                            `}
                    >
                      <div
                        className={`transition-transform duration-200 ${
                          layoutStyle.type === option.value ? 'scale-110' : ''
                        }`}
                      >
                        {option.icon}
                      </div>
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Render appropriate controls based on display type */}
          {isBlock && renderBlockControls()}
          {isFlex && renderFlexControls()}
          {isGrid && renderGridControls()}
        </IGRPTabsPrimitive>
      </div>
    </div>
  )
}
