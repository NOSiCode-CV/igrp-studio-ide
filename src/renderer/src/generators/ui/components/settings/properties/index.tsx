import {
  IGRPCombobox,
  IGRPDatePickerSingle,
  IGRPOptionsProps,
  IGRPRadioGroup
} from '@igrp/igrp-framework-react-design-system'
import DynamicKeyValueForm from '@renderer/components/domain-form'
import IconBrowser from '@renderer/components/icon/icon-browser'
import MultipleSelector from '@renderer/components/multiples-selector'
import {
  IGRPAccordionPrimitive,
  IGRPAccordionContentPrimitive,
  IGRPAccordionItemPrimitive,
  IGRPAccordionTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  IGRPPopoverPrimitive,
  IGRPPopoverContentPrimitive,
  IGRPPopoverTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPSwitch } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import { capitalize, getLabel } from '@renderer/utils'
import { MoreVertical, Plus } from 'lucide-react'

import React, { useEffect, useState } from 'react'
import { Option } from '@renderer/generators/ui/hooks/useCustomCode'
import { StateComponent } from '../../sidebar/custom-code/custom-code-state'
import { Segment, State } from '@igrp/igrp-studio-nextjs-engine/types'
import { getDynamicSegments, RouteSegment } from './route-parser'
import { IGRPBadge } from '@igrp/igrp-framework-react-design-system'
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system'
import { DataValue } from '@renderer/lib/dnd/types'
import { useComponents } from '@renderer/generators/ui/hooks/useComponents'

interface Data {
  state?: State
  value?: DataValue
}

interface DataProperties {
  [key: string]: {
    state?: State
    value?: DataValue
  }
}

interface SettingsProps {
  propsComp: Record<string, any>
  formValues: Record<string, any>
  pageOptions?: any
  statesOptions: Option[]
  columnsOptions: IGRPOptionsProps[]
  dataProperties:
    | {
        [key: string]: {
          state?: State
          value?: DataValue
        }
      }
    | undefined
  tag: string
  onInputChange: (fieldPath: string, value: any) => void
  onSelectState: (field: string, state?: State, value?: DataValue) => void
}

interface PageSelectionConfigProps {
  value: string
  fieldPath?: string
  key: string
  parentKey?: string
  pageOptions: any
  showNavigationParams?: boolean
  navigationParams?: Segment[]
  segments: Segment[]
  columnsOptions: (IGRPOptionsProps & { type?: 'pageParam' | 'column' })[]
  onInputChange?: (fieldPath: string, value: any) => void
  onPageChange: (value: string) => void
  onNavigationParamsChange?: (params: Segment[]) => void
}

const toMap = (items: any) => {
  return (
    items &&
    items.map((value: string) => ({
      value,
      label: value
    }))
  )
}

const getNestedValue = (obj: any, path: string) => {
  return path
    .split('.')
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

const RENDER_IGNORE = ['segments', 'params']

const RenderPropsConfig = ({
  propsComp,
  formValues,
  pageOptions,
  statesOptions,
  columnsOptions,
  tag,
  dataProperties,
  onInputChange,
  onSelectState
}: SettingsProps): React.ReactNode => {
  const { getRefsOptions, getArqumentsOptions } = useComponents()

  const refsOptions = getRefsOptions()
  const argumentsOptions = getArqumentsOptions()

  const renderField = (key: string, fieldConfig: any, parentKey?: string): React.ReactNode => {
    const { enum: enumValues, type: typeDefault, items } = fieldConfig
    const type = enumValues ? 'enum' : typeDefault

    const fieldPath = parentKey ? `${parentKey}.${key}` : key

    const value = getNestedValue(formValues, fieldPath)

    const xUiWidget = fieldConfig['x-ui-widget']
    const xMetaLabel = fieldConfig['x-meta']?.['label'] || getLabel(key)

    if (RENDER_IGNORE.includes(key)) return <></>
    else if (fieldConfig.type === 'object' && fieldConfig.properties) {
      const props = fieldConfig.properties
      return (
        <IGRPAccordionPrimitive type="single" collapsible className="w-full">
          <IGRPAccordionItemPrimitive key={key} value={key}>
            <IGRPAccordionTriggerPrimitive
              iconName="ChevronDown"
              showIcon={true}
              iconPlacement="end"
            >
              {xMetaLabel}
            </IGRPAccordionTriggerPrimitive>
            <IGRPAccordionContentPrimitive className="space-y-3">
              {Object.keys(props).map((nestedKey) =>
                renderField(nestedKey, props[nestedKey], parentKey ? `${parentKey}.${key}` : key)
              )}
            </IGRPAccordionContentPrimitive>
          </IGRPAccordionItemPrimitive>
        </IGRPAccordionPrimitive>
      )
    } else if (key === 'iconName' || xUiWidget === 'icon') {
      return (
        <div className=" group space-y-2">
          <IGRPLabelPrimitive htmlFor={key} className="flex justify-between ">
            <span>{xMetaLabel}</span>
            <FieldActions
              field={key}
              statesOptions={statesOptions}
              argumentsOptions={argumentsOptions}
              value={value}
              tag={tag}
              type={type}
              onSelectState={onSelectState}
              dataProperties={dataProperties}
            />
          </IGRPLabelPrimitive>
          <IconBrowser
            selectedIcon={value}
            onSelectedIcon={(icon: string) => {
              onInputChange(fieldPath, icon)
            }}
          />
        </div>
      )
    } else if (key === 'options') {
      return (
        <DynamicKeyValueForm
          onAdd={(opt) => {
            onInputChange(fieldPath, opt)
          }}
        />
      )
    } else if (xUiWidget === 'uri') {
      return (
        <div className="group space-y-3">
          <IGRPLabelPrimitive htmlFor={key} className="flex justify-between items-center">
            <span>{xMetaLabel}</span>
            <FieldActions
              field={key}
              statesOptions={statesOptions}
              argumentsOptions={argumentsOptions}
              value={value}
              tag={tag}
              type={type}
              onSelectState={onSelectState}
              dataProperties={dataProperties}
            />
          </IGRPLabelPrimitive>
          <SlugBindingConfig
            key={key}
            label={xMetaLabel}
            value={value}
            fieldPath={fieldPath}
            parentKey={parentKey}
            pageOptions={pageOptions}
            onInputChange={onInputChange}
            columnsOptions={columnsOptions}
            segments={formValues['segments']}
            navigationParams={formValues['params']}
          />
        </div>
      )
      //references
    } else if (xUiWidget === 'ref') {
      return (
        <div className="space-y-2">
          <IGRPLabelPrimitive htmlFor={key} className="flex justify-between items-center">
            <span>{xMetaLabel}</span>
          </IGRPLabelPrimitive>
          <IGRPCombobox
            value={value}
            onChange={(value) => {
              onInputChange?.(fieldPath, value as string)
            }}
            options={refsOptions}
            placeholder="Select target component"
            className="w-full"
          />
        </div>
      )
    }

    return (
      <div
        className={cn(
          type === 'boolean' && 'flex flex-1 space-x-3 align-middle justify-between space-y-2',
          type !== 'boolean' && 'flex flex-col space-y-2',
          'group'
        )}
        key={key}
      >
        <IGRPLabelPrimitive htmlFor={key} className="flex justify-between items-center">
          <span>{xMetaLabel}</span>
          {type !== 'boolean' && (
            <FieldActions
              field={key}
              statesOptions={statesOptions}
              argumentsOptions={argumentsOptions}
              value={value}
              tag={tag}
              type={type}
              onSelectState={onSelectState}
              dataProperties={dataProperties}
            />
          )}
        </IGRPLabelPrimitive>

        {(() => {
          switch (type) {
            case 'boolean':
              return (
                <div className="flex space-x-2 items-center">
                  <FieldActions
                    field={key}
                    statesOptions={statesOptions}
                    value={value}
                    tag={tag}
                    type={type}
                    onSelectState={onSelectState}
                    dataProperties={dataProperties}
                    argumentsOptions={argumentsOptions}
                  />

                  <IGRPSwitch
                    id={parentKey ? `${parentKey}.${key}` : key}
                    name={key}
                    checked={value}
                    onCheckedChange={(checked) => {
                      onInputChange(fieldPath, checked)
                    }}
                  />
                </div>
              )
            case 'enum':
              return (
                <IGRPCombobox
                  value={value}
                  onChange={(value) => onInputChange(fieldPath, value)}
                  options={toMap(enumValues)}
                  className="w-full"
                />
              )
            case 'string':
            case 'any':
              return (
                <IGRPInputPrimitive
                  id={parentKey ? `${parentKey}.${key}` : key}
                  type="text"
                  name={key}
                  value={value}
                  onChange={(e) => onInputChange(fieldPath, (e.target as HTMLInputElement).value)}
                />
              )
            case 'number':
              return (
                <IGRPInputPrimitive
                  id={parentKey ? `${parentKey}.${key}` : key}
                  type="number"
                  name={key}
                  value={Number(value)}
                  onChange={(e) => {
                    onInputChange(fieldPath, Number((e.target as HTMLInputElement).value))
                  }}
                />
              )
            case 'date':
              return (
                <IGRPDatePickerSingle
                  name={parentKey ? `${parentKey}.${key}` : key}
                  date={value ? new Date(value) : undefined}
                  onDateChange={(value) => onInputChange(fieldPath, value)}
                  className=""
                  id={parentKey ? `${parentKey}.${key}` : key}
                />
              )
            case 'array':
              return (
                <MultipleSelector
                  value={value}
                  onChange={(value) => onInputChange(fieldPath, value)}
                  options={toMap(items?.enum)}
                />
              )

            default:
              return null
          }
        })()}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {Object.keys(propsComp).map((key, index) => {
        return <React.Fragment key={index}>{renderField(key, propsComp[key])}</React.Fragment>
      })}
    </div>
  )
}

const FieldActions = ({
  field,
  statesOptions,
  value,
  tag,
  type,
  dataProperties,
  onSelectState,
  argumentsOptions
}: {
  field: string
  value: string
  tag: string
  type: string
  statesOptions: Option[]
  argumentsOptions: Option[]
  dataProperties?: DataProperties
  onSelectState: (field: string, state: State | undefined, value: DataValue | undefined) => void
}): React.ReactNode => {
  const [open, setOpen] = useState<boolean>(false)
  const [selected, setSelected] = useState<Data>({})
  const state: State = {
    id: '',
    name: `${tag.charAt(0).toLowerCase() + tag.slice(1)}${capitalize(field)}`,
    type: type || 'string',
    imports: [],
    defaultValue: value
  }

  const stateSaved = selected.state || selected.value ? selected : dataProperties?.[field]
  const inputValue = selected.value?.code ?? dataProperties?.[field]?.value?.code ?? ''

  return (
    <>
      <IGRPPopoverPrimitive>
        <IGRPPopoverTriggerPrimitive asChild>
          <IGRPButtonPrimitive
            variant="ghost"
            size="sm"
            className="p-0 opacity-0 group-hover:opacity-100 transition-opacity h-6"
          >
            {stateSaved && (
              <div className="bg-muted rounded-sm p-0.5">
                {stateSaved.state?.name || stateSaved.value?.code}
              </div>
            )}
            <MoreVertical className="w-3 h-3" />
          </IGRPButtonPrimitive>
        </IGRPPopoverTriggerPrimitive>
        <IGRPPopoverContentPrimitive align="end" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select an existing state or create a new one to bind a dynamic value.
          </p>
          <div className="space-y-2">
            <IGRPCombobox
              label="State"
              value={stateSaved?.state?.name || ''}
              onChange={(selectedState) => {
                const result = selectedState
                  ? {
                      id: '',
                      name: selectedState as string,
                      type: '',
                      imports: [],
                      defaultValue: undefined,
                      generate: false
                    }
                  : undefined

                onSelectState(field, result, undefined)

                setSelected(result ? { state: result } : {})
              }}
              options={statesOptions}
              className="w-full"
              placeholder="Select State"
            />
          </div>
          {argumentsOptions.length > 0 ? (
            <>
              <IGRPSeparator />
              <div className="space-y-2">
                <IGRPCombobox
                  label="Page Arguments"
                  value={stateSaved?.value?.code || ''}
                  onChange={(selectedArgs) => {
                    const result = selectedArgs
                      ? {
                          id: '',
                          code: selectedArgs as string
                        }
                      : undefined
                    onSelectState(field, undefined, result)
                    setSelected(result ? { value: result } : {})
                  }}
                  options={argumentsOptions}
                  className="w-full"
                  placeholder="Select Page arguments"
                />
              </div>
            </>
          ) : (
            <></>
          )}
          <>
            <IGRPSeparator />
            <div className="space-y-2">
              <IGRPLabelPrimitive> Variable Name</IGRPLabelPrimitive>
              <IGRPInputPrimitive
                id={`${field}-variable-name`}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  const result = newValue
                    ? {
                        id: '',
                        code: newValue
                      }
                    : undefined
                  onSelectState(field, undefined, result)
                  setSelected(result ? { value: result } : {})
                }}
              />
            </div>
          </>
          <div className="flex justify-end">
            <IGRPButtonPrimitive
              variant={'secondary'}
              size={'sm'}
              onClick={() => setOpen(!open)}
              className="w-full"
            >
              <span>
                <Plus />
              </span>
              Generate New State
            </IGRPButtonPrimitive>
          </div>
        </IGRPPopoverContentPrimitive>
      </IGRPPopoverPrimitive>

      <StateComponent setOpen={setOpen} open={open} state={state} />
    </>
  )
}

export const PageSelectionConfig = ({
  value,
  fieldPath,
  pageOptions,
  columnsOptions,
  segments,
  onInputChange,
  onPageChange,
  showNavigationParams = false,
  navigationParams = [],
  onNavigationParamsChange
}: PageSelectionConfigProps): React.ReactNode => {
  const [selectedPagePath, setSelectedPagePath] = useState<string>(value)

  const [dynamicSegments, setDynamicPagePath] = useState(getDynamicSegments(selectedPagePath) ?? [])

  useEffect(() => {
    setDynamicPagePath(getDynamicSegments(selectedPagePath))
  }, [selectedPagePath])

  // Handler to create segments with proper context
  const handleSegmentsChange = (items: Record<string, string>[]): void => {
    const mappedSegments = items.map((item) => {
      // Find the selected data field to determine contextp
      const selectedField = columnsOptions.find((option) => option.value === item.columnName)
      return {
        name: item.name,
        tag: item.columnName,
        value: undefined,
        context: selectedField?.type
      }
    })

    onInputChange?.('segments', mappedSegments)
  }

  // Handler to create segments with proper context
  const handleParamsChange = (items: Record<string, string>[]): void => {
    const mappedParams = items.map((item) => {
      const selectedField = columnsOptions.find((option) => option.value === item.paramName)
      return {
        name: item.paramName,
        tag: item.paramValue,
        value: undefined,
        context: selectedField?.type as 'column' | 'variable'
      }
    })

    onNavigationParamsChange?.(mappedParams)

    onInputChange?.('params', mappedParams)
  }

  // Handler to get default segments for the form
  const getDefaultSegments = (): {
    name: string
    columnName: string
    value: string
  }[] => {
    if (segments && segments.length > 0) {
      return segments.map((item: Segment) => ({
        name: item.name,
        columnName: item.tag || '',
        value: ''
      }))
    }
    return [{ name: '', columnName: '', value: '' }]
  }

  // Handler to get route segment options
  const getRouteSegmentOptions = (): { label: string; value: string }[] => {
    return dynamicSegments.map((segment: RouteSegment) => ({
      label: `${segment.name} (${segment.type})`,
      value: segment.originalSegment
    }))
  }

  // Handler to get data field options
  const getDataFieldOptions = (): { label: string; value: string }[] => {
    return columnsOptions.map((option) => ({
      ...option,
      label: option.label || option.value
    }))
  }

  const getNavigationParamsOptions = (): {
    paramName: string
    paramValue: string
  }[] => {
    return navigationParams && navigationParams.length > 0
      ? navigationParams.map((param) => ({
          paramName: param.name,
          paramValue: param.tag || ''
        }))
      : []
  }

  const fieldPairs = [
    {
      key: 'name',
      label: 'Route Segment',
      options: getRouteSegmentOptions(),
      placeholder: 'Select Route Segment'
    },
    {
      key: 'columnName',
      label: 'Data Field',
      options: getDataFieldOptions()
    }
  ]

  const navigationParamsFieldPairs = [
    { key: 'paramValue', label: 'Param Value' },
    {
      key: 'paramName',
      label: 'Param Name',
      options: getDataFieldOptions()
    }
  ]

  return (
    <div className="space-y-4">
      <IGRPCombobox
        value={value}
        onChange={(value) => {
          if (fieldPath) onInputChange?.(fieldPath, value as string)

          onPageChange(value as string)

          setSelectedPagePath(value as string)
        }}
        options={pageOptions}
        placeholder="Select Page"
        className="w-full"
      />

      {selectedPagePath && dynamicSegments.length > 0 && (
        <div className="space-y-2">
          <IGRPLabelPrimitive>Available Dynamic Segments</IGRPLabelPrimitive>
          <div className="flex flex-wrap gap-2">
            {dynamicSegments.map((segment, index) => (
              <IGRPBadge key={index} variant="outline">
                {segment.name} ({segment.type})
              </IGRPBadge>
            ))}
          </div>
        </div>
      )}

      {selectedPagePath && dynamicSegments.length === 0 && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            This route has no dynamic segments. Only static routes detected.
          </p>
        </div>
      )}

      {selectedPagePath && dynamicSegments.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">Map route segments to data source fields</p>

          <DynamicKeyValueForm
            required
            defaultItems={getDefaultSegments()}
            onAdd={handleSegmentsChange}
            fieldPairs={fieldPairs}
          />
        </>
      )}

      {showNavigationParams && (
        <div className="space-y-2">
          <IGRPLabelPrimitive>Navigation Parameters</IGRPLabelPrimitive>

          <DynamicKeyValueForm
            defaultItems={getNavigationParamsOptions()}
            onAdd={(items) => {
              handleParamsChange(items)
            }}
            fieldPairs={navigationParamsFieldPairs}
          />
        </div>
      )}
    </div>
  )
}

const SlugBindingConfig = ({
  value,
  fieldPath,
  key,
  parentKey,
  segments,
  navigationParams,
  pageOptions,
  columnsOptions,
  onInputChange
}: {
  value: string
  fieldPath: string
  key: string
  parentKey?: string
  label: string
  columnsOptions: IGRPOptionsProps[]
  pageOptions: Option
  segments: Segment[]
  navigationParams: Segment[]
  onInputChange: (fieldPath: string, value: any) => void
}): React.ReactNode => {
  const [linkType, setLinkType] = useState<string>()

  useEffect(() => {
    const defaultType =
      value && Array.isArray(pageOptions) && pageOptions.some((page) => page.value === value)
        ? 'PAGE'
        : 'LINK'

    setLinkType(defaultType)
  }, [pageOptions, value])

  return (
    <>
      <IGRPRadioGroup
        id={parentKey ? `${parentKey}.${key}` : key}
        name={key}
        value={linkType}
        onValueChange={(e) => {
          setLinkType(e)
        }}
        options={[
          { value: 'LINK', label: 'Link' },
          { value: 'PAGE', label: 'Page' }
        ]}
      />
      {linkType === 'LINK' ? (
        <IGRPInputPrimitive
          id={parentKey ? `${parentKey}.${key}` : key}
          type="email"
          name={key}
          value={value}
          onChange={(e) => onInputChange(fieldPath, e.target.value)}
        />
      ) : (
        <PageSelectionConfig
          value={value}
          fieldPath={fieldPath}
          key={key}
          parentKey={parentKey}
          pageOptions={pageOptions}
          columnsOptions={columnsOptions}
          segments={segments}
          onInputChange={onInputChange}
          onPageChange={() => void 0}
          showNavigationParams={true}
          navigationParams={navigationParams}
        />
      )}
    </>
  )
}

export default RenderPropsConfig
