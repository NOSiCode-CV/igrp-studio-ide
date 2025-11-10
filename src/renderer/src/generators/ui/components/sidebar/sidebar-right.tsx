import { RotateCcw, Settings, X } from 'lucide-react'

import {
  IGRPButtonPrimitive,
  IGRPSidebarContentPrimitive,
  IGRPSidebarHeaderPrimitive,
  IGRPSidebarPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import { useTranslation } from 'react-i18next'
import RenderPropsConfig from '../settings/properties'
import {
  IGRPAccordionPrimitive,
  IGRPAccordionContentPrimitive,
  IGRPAccordionItemPrimitive,
  IGRPAccordionTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import {
  IGRPTabsPrimitive,
  IGRPTabsContentPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import useStudio from '@renderer/hooks/use-studio'
import { DataValue, StructuredComponent } from '@renderer/lib/dnd/types'
import { EmptyList } from '@renderer/components/empty-list'
import Interactions from '../settings/Interactions'
import { StyleTab } from '../settings/style'
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import useCustomCode from '../../hooks/useCustomCode'
import { State } from '@igrp/igrp-studio-nextjs-engine/types'
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system'

import { ChangeEvent, ComponentProps, useCallback, useEffect, useMemo, useState } from 'react'
import Loader from '@renderer/components/loader'
import { getRequiredDataSchema } from '../../dnd/helpers'
import { useComponents } from '../../hooks/useComponents'
import CopyContent from './copy-content'

interface SidebarRightProps extends ComponentProps<typeof IGRPSidebarPrimitive> {
  comp?: StructuredComponent
  parentComp?: StructuredComponent
  path?: string
}

const SidebarRight = ({ comp, path, parentComp, ...props }: SidebarRightProps) => {
  const { t } = useTranslation()
  const { getPropertiesComponent, getDataComponent, getChildPropertiesComponent, pageOptions } =
    useStudio()
  const {
    currentComponent: editingComponentParams,
    handleUpdateChildComponent,
    clearEditingComponent
  } = useDroppedComponents()

  const { statesOptions } = useCustomCode()
  const { getArqumentsOptions } = useComponents()
  const argumentsOptions = getArqumentsOptions()

  // Memoized derived state
  const currentComp = useMemo(
    () => comp || editingComponentParams?.component,
    [comp, editingComponentParams]
  )

  const currentPath = path || editingComponentParams?.path || ''

  const { label, data, componentName, childProperties = {}, id: componentId } = currentComp || {}

  // State management
  const [tempEditingComponent, setTempEditingComponent] = useState<StructuredComponent | undefined>(
    undefined
  )

  const [propsComponent, setPropsComponent] = useState<Record<string, any>>({})

  const [childformValues, setChildformValues] = useState<Record<string, any>>({})

  const [propsComponentChild, setPropsComponentChild] = useState<Record<string, any>>({})

  const [columnsOptions, setColumnsOptions] = useState<
    (IGRPOptionsProps & { type?: 'column' | 'pageParam' })[]
  >([])

  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Helper function to check if a key is referenced in properties (including nested objects)
  const isKeyReferencedInProperties = useCallback(
    (key: string, propertiesObj: Record<string, any>): boolean => {
      for (const [propKey, propValue] of Object.entries(propertiesObj)) {
        // Check if the property key matches the data key
        if (propKey === key) {
          return true
        }

        // If property value is an object, recursively check its keys
        if (propValue && typeof propValue === 'object' && !Array.isArray(propValue)) {
          if (isKeyReferencedInProperties(key, propValue)) {
            return true
          }
        }
      }
      return false
    },
    []
  )

  useEffect(() => {
    const options =
      parentComp?.children
        .filter(
          (column) =>
            column?.properties?.dataProperties &&
            !column.properties.dataProperties.isVirtual &&
            column.properties.dataProperties.isType
        )
        .map((column) => {
          return {
            value: column.tag,
            label: column.properties.headerTitle,
            type: 'column' as const
          }
        }) ?? []

    // Join all data sources with type indicators
    const combinedDataOptions = [
      ...argumentsOptions.map((option) => ({
        ...option,
        type: 'pageParam' as const,
        label: `${option.label} (Variable)`
      })),
      ...options
    ]

    setColumnsOptions(combinedDataOptions)
  }, [parentComp])

  // Load properties component and delete data not in the schema
  useEffect(() => {
    if (!componentId || !componentName) return

    setTempEditingComponent(undefined)

    getDataComponent(currentPath, componentName).then((response) => {
      const requiredDataSchema = getRequiredDataSchema(response)

      // Check if each key in data exists in response
      if (data && requiredDataSchema) {
        const cleanedData = { ...data }

        // Iterate through each key in the response
        Object.keys(requiredDataSchema).forEach((key) => {
          // If the key doesn't exist in the current data, add it
          if (!(key in data)) {
            cleanedData[key] = requiredDataSchema[key]
            // hasChanges = true;
          }
        })

        // Remove keys with empty object values
        Object.keys(cleanedData).forEach((key) => {
          if (
            cleanedData[key] &&
            typeof cleanedData[key] === 'object' &&
            !Array.isArray(cleanedData[key]) &&
            Object.keys(cleanedData[key]).length === 0
          ) {
            delete cleanedData[key]
            // hasChanges = true;
          }
        })

        setTempEditingComponent(
          (prev) =>
            ({
              ...currentComp,
              ...prev,
              data: cleanedData
            }) as StructuredComponent
        )
      }
    })

    const loadProps = async () => {
      try {
        setIsLoading(true)
        const data = await getPropertiesComponent(currentPath, componentName)
        setPropsComponent(data)

        // Função para fazer deep merge de objetos
        const deepMerge = (target: any, source: any) => {
          const result = { ...target }

          for (const key in source) {
            if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
              result[key] = deepMerge(target[key], source[key])
            } else {
              // Always use source value if it exists
              result[key] = source[key]
            }
          }

          return result
        }

        const target = // Aplica os valores padrão
          Object.entries(data ?? {}).reduce(
            (acc, [key, config]) => {
              if (config.type === 'object' && config.properties) {
                acc[key] = Object.entries(config.properties).reduce(
                  (objAcc, [propKey, propConfig]: [string, any]) => {
                    if (propConfig.default !== undefined || propConfig.required) {
                      objAcc[propKey] = propConfig.default
                    }
                    return objAcc
                  },
                  {} as Record<string, any>
                )
              } else if (config.default || config.required) {
                acc[key] = config.default
              }
              return acc
            },
            {} as Record<string, any>
          )
        const source = // Filter properties based on schema and requirements
          Object.entries(currentComp?.properties ?? {}).reduce(
            (acc, [key, value]) => {
              const schemaConfig = (data as Record<string, any>)?.[key]

              // Skip if property not in schema
              if (!schemaConfig) {
                return acc
              }

              // Handle nested objects
              if (schemaConfig.type === 'object' && schemaConfig.properties) {
                const filteredNestedProps = Object.entries(value || {}).reduce(
                  (nestedAcc, [nestedKey, nestedValue]) => {
                    const nestedConfig = schemaConfig.properties[nestedKey]
                    // Keep if in schema and (required or value exists, including null)
                    if (nestedConfig && (nestedConfig.required || nestedValue !== undefined)) {
                      nestedAcc[nestedKey] = nestedValue
                    }
                    return nestedAcc
                  },
                  {} as Record<string, any>
                )

                if (Object.keys(filteredNestedProps).length > 0) {
                  acc[key] = filteredNestedProps
                }
              }
              // Handle non-object properties
              else if (schemaConfig.required || value !== undefined) {
                // Keep the value if it exists in current properties (including null)
                acc[key] = value
              }

              return acc
            },
            {} as Record<string, any>
          )

        // Initialize form values with deep merge
        const initialValues = deepMerge(target, source)

        setTempEditingComponent(
          (prev) =>
            ({
              ...currentComp,
              ...prev,
              properties: initialValues
            }) as StructuredComponent
        )

        //TODO review this, when properties key
        if (data && tempEditingComponent?.data) {
          // Check if any data keys are referenced in the schema properties
          /* const cleanedData = { ...tempEditingComponent.data };
                    let hasChanges = false;

                    Object.keys(tempEditingComponent.data).forEach((key) => {
                        const isReferencedInProps = isKeyReferencedInProperties(
                            key,
                            data || {}
                        );

                        // Only delete if not referenced in schema properties
                        if (!isReferencedInProps) {
                            delete cleanedData[key];
                            hasChanges = true;
                        }
                    });

                    // If we made changes, update the component with cleaned data
                    if (hasChanges) {
                        handleUpdateChildComponent(componentId, {
                            data: cleanedData,
                        });
                    }  */
        }
      } catch (error) {
        console.error('Error loading properties component:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProps()
  }, [componentId, componentName, currentPath, currentComp])

  // Load properties component
  useEffect(() => {
    if (!componentName) return

    const loadProps = async () => {
      try {
        const data = await getChildPropertiesComponent(currentPath, componentName)
        setPropsComponentChild(data && !Array.isArray(data) ? data : {})

        // Initialize form values
        const initialValues = Object.entries(data ?? {}).reduce(
          (acc, [key, config]) => {
            if (config.default !== null || config.required) {
              acc[key] = childProperties[key] ?? config.default
            }
            return acc
          },
          {} as Record<string, any>
        )

        setChildformValues(initialValues)
      } catch (error) {
        console.error('Error loading properties component:', error)
      }
    }

    loadProps()
  }, [componentName, currentPath])

  // Debounced component update
  useEffect(() => {
    if (!componentId || tempEditingComponent?.id !== componentId) return
    handleUpdateChildComponent(componentId, {
      ...tempEditingComponent
    })
  }, [tempEditingComponent, componentId])

  useEffect(() => {
    if (!componentId) return
    handleUpdateChildComponent(componentId, {
      childProperties: { ...childformValues }
    })
  }, [childformValues, componentId])

  // Helper function to set nested values in objects
  const setNestedValue = useCallback((obj: any, path: string[], val: any): any => {
    const [first, ...rest] = path
    if (rest.length === 0) {
      return { ...obj, [first]: val }
    }
    return {
      ...obj,
      [first]: setNestedValue(obj[first] || {}, rest, val)
    }
  }, [])

  // Custom event handlers
  const handleComponentPropertyChange = useCallback(
    (fieldPath: string, value: string | boolean) => {
      setTempEditingComponent((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          properties: setNestedValue(prev.properties || {}, fieldPath.split('.'), value)
        }
      })
    },
    [setNestedValue]
  )

  const handleChildPropertyChange = useCallback(
    (fieldPath: string, value: string | boolean) => {
      setChildformValues((prev) => setNestedValue(prev, fieldPath.split('.'), value))
    },
    [setNestedValue]
  )

  // Function to reset temp data to original component data
  const resetTempData = useCallback(() => {
    if (!componentId) return
    handleUpdateChildComponent(componentId, {
      ...currentComp
    })
  }, [currentComp, componentId])

  const handleClose = useCallback(() => {
    clearEditingComponent()
  }, [clearEditingComponent])

  const udpateTag = (e: ChangeEvent<HTMLInputElement>) => {
    if (!componentId) return

    setTempEditingComponent(
      (prev) =>
        ({
          ...prev,
          tag: e.target.value
        }) as StructuredComponent
    )
  }

  const udpateDataProperties = ({
    field,
    state,
    value
  }: {
    field: string
    state?: State
    value?: DataValue
  }) => {
    if (!componentId) return

    const updatedData = { ...tempEditingComponent?.data }

    delete updatedData[field]

    if (state) {
      updatedData[field] = {
        state
      }
    }

    if (value) {
      updatedData[field] = {
        value
      }
    }

    setTempEditingComponent(
      (prev) =>
        ({
          ...prev,
          data: updatedData
        }) as StructuredComponent
    )
  }

  return (
    <IGRPSidebarPrimitive
      collapsible="none"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row top-(--header-height-two)! h-[calc(100svh-var(--header-height-three))]!"
      {...props}
      style={
        {
          '--sidebar-width': '380px'
        } as React.CSSProperties & { '--sidebar-width': string }
      }
    >
      <IGRPSidebarHeaderPrimitive>
        <div className="items-center justify-between flex flex-1">
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">{t('settings')}</h4>

            {componentName && <p className="text-sm text-muted-foreground"></p>}
          </div>
          <div className="flex items-center gap-2">
            {!comp && (
              <>
                <IGRPButtonPrimitive
                  variant="outline"
                  size="icon"
                  onClick={resetTempData}
                  title="Reset changes"
                >
                  <RotateCcw className="h-4 w-4" />
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive variant={'ghost'} onClick={handleClose}>
                  <X />
                </IGRPButtonPrimitive>
              </>
            )}
          </div>
        </div>
      </IGRPSidebarHeaderPrimitive>
      <IGRPSidebarContentPrimitive>
        {isLoading ? (
          <Loader />
        ) : !tempEditingComponent ? (
          <div className="p-4">
            <EmptyList
              icon={<Settings />}
              title="Settings Components"
              description="Select a component on the table to start edit"
            />
          </div>
        ) : (
          <>
            <div className="space-y-2 p-2">
              <IGRPLabelPrimitive htmlFor={'tab'}>
                {`${label || componentName} - ${componentId}`}
              </IGRPLabelPrimitive>
              <IGRPInputPrimitive id="tag" value={tempEditingComponent?.tag} onChange={udpateTag} />
            </div>
            <IGRPTabsPrimitive className="flex-1 px-2" defaultValue="props">
              <IGRPTabsListPrimitive className="grid w-full grid-cols-4">
                <IGRPTabsTriggerPrimitive value="props">Props</IGRPTabsTriggerPrimitive>
                <IGRPTabsTriggerPrimitive value="styles">Style</IGRPTabsTriggerPrimitive>
                <IGRPTabsTriggerPrimitive value="interactions">
                  Interactions
                </IGRPTabsTriggerPrimitive>
                <IGRPTabsTriggerPrimitive value="copy-content">Copy</IGRPTabsTriggerPrimitive>
              </IGRPTabsListPrimitive>

              <IGRPTabsContentPrimitive value="props" className="space-y-6">
                <IGRPAccordionPrimitive
                  type="single"
                  collapsible
                  className="w-full"
                  defaultValue="item-1"
                >
                  <IGRPAccordionItemPrimitive value="item-1">
                    <IGRPAccordionTriggerPrimitive
                      iconName="ChevronDown"
                      showIcon
                      iconPlacement="end"
                    >
                      {t('properties')}
                    </IGRPAccordionTriggerPrimitive>
                    <IGRPAccordionContentPrimitive className="space-y-2">
                      {propsComponent && (
                        <RenderPropsConfig
                          propsComp={propsComponent}
                          formValues={tempEditingComponent?.properties}
                          pageOptions={pageOptions}
                          dataProperties={tempEditingComponent.data}
                          statesOptions={statesOptions}
                          columnsOptions={columnsOptions}
                          tag={tempEditingComponent?.tag || ''}
                          onInputChange={handleComponentPropertyChange}
                          onSelectState={(
                            field: string,
                            state: State | undefined,
                            value: DataValue | undefined
                          ) =>
                            udpateDataProperties({
                              field,
                              state,
                              value
                            })
                          }
                        />
                      )}
                    </IGRPAccordionContentPrimitive>
                  </IGRPAccordionItemPrimitive>
                  {Object.keys(propsComponentChild).length > 0 && (
                    <IGRPAccordionItemPrimitive value="item-1">
                      <IGRPAccordionTriggerPrimitive
                        iconName="ChevronDown"
                        showIcon
                        iconPlacement="end"
                      >
                        {t('Child Properties')}
                      </IGRPAccordionTriggerPrimitive>
                      <IGRPAccordionContentPrimitive className="space-y-2">
                        <RenderPropsConfig
                          propsComp={propsComponentChild}
                          formValues={childformValues}
                          pageOptions={pageOptions}
                          dataProperties={tempEditingComponent.data}
                          statesOptions={statesOptions}
                          columnsOptions={columnsOptions}
                          tag={tempEditingComponent?.tag || ''}
                          onInputChange={handleChildPropertyChange}
                          onSelectState={(
                            field: string,
                            state: State | undefined,
                            value: DataValue | undefined
                          ) =>
                            udpateDataProperties({
                              field,
                              state,
                              value
                            })
                          }
                        />
                      </IGRPAccordionContentPrimitive>
                    </IGRPAccordionItemPrimitive>
                  )}
                </IGRPAccordionPrimitive>
              </IGRPTabsContentPrimitive>
              <IGRPTabsContentPrimitive value="styles" className="space-y-6">
                <StyleTab
                  comp={tempEditingComponent}
                  path={currentPath}
                  onInteranctionsChange={handleUpdateChildComponent}
                />
              </IGRPTabsContentPrimitive>
              <IGRPTabsContentPrimitive value="interactions" className="space-y-6">
                <Interactions
                  comp={tempEditingComponent}
                  path={currentPath}
                  onInteranctionsChange={handleUpdateChildComponent}
                  columnsOptions={columnsOptions}
                />
              </IGRPTabsContentPrimitive>
              <IGRPTabsContentPrimitive value="copy-content" className="space-y-6">
                <CopyContent currentComp={currentComp} />
              </IGRPTabsContentPrimitive>
            </IGRPTabsPrimitive>
          </>
        )}
      </IGRPSidebarContentPrimitive>
    </IGRPSidebarPrimitive>
  )
}

export default SidebarRight
