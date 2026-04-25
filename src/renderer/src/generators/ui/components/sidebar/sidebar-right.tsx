import {
    type IGRPOptionsProps,
    IGRPSidebarContentPrimitive,
    IGRPSidebarPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { State } from '@igrp/igrp-studio-nextjs-engine/types'
import { EmptyList } from '@renderer/components/empty-list'
import Loader from '@renderer/components/loader'
import useStudio from '@renderer/hooks/use-studio'
import type { DataValue, StructuredComponent } from '@renderer/lib/dnd/types'
import { Settings } from 'lucide-react'
import {
    type ChangeEvent,
    type ComponentProps,
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react'
import { useTranslation } from 'react-i18next'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import { getRequiredDataSchema } from '../../dnd/helpers'
import { useComponents } from '../../hooks/useComponents'
import useCustomCode from '../../hooks/useCustomCode'
import Interactions from '../settings/Interactions'
import { StyleTab } from '../settings/style'
import CopyContent from './copy-content'
import ComponentIdentitySection from './sidebar-right-identity'
import SidebarRightHeader from './sidebar-right-header'
import PropertiesPanel from './sidebar-right-properties-panel'

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
        clearEditingComponent,
        setAllRestData,
        restData
    } = useDroppedComponents()

    const { statesOptions } = useCustomCode()
    const { getArqumentsOptions } = useComponents()
    const argumentsOptions = getArqumentsOptions()

    // Memoized derived state
    const currentComp = useMemo(
        () => comp || editingComponentParams?.component,
        [comp, editingComponentParams]
    )

    const isRootComponent = useMemo(() => {
        return (
            currentComp?.componentName === 'page' ||
            currentComp?.componentName === 'component' ||
            currentComp?.componentName === 'processStep'
        )
    }, [currentComp])

    const currentPath = path || editingComponentParams?.path || ''

    const { label, data, componentName, childProperties = {}, id: componentId } = currentComp || {}

    // State management
    const [tempEditingComponent, setTempEditingComponent] = useState<
        StructuredComponent | undefined
    >(undefined)

    const [propsComponent, setPropsComponent] = useState<Record<string, any>>({})

    const [childformValues, setChildformValues] = useState<Record<string, any>>({})

    const [propsComponentChild, setPropsComponentChild] = useState<Record<string, any>>({})

    const [columnsOptions, setColumnsOptions] = useState<
        (IGRPOptionsProps & { type?: 'column' | 'pageParam' })[]
    >([])

    const [isLoading, setIsLoading] = useState<boolean>(false)

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

        const loadProps = async (): Promise<void> => {
            try {
                setIsLoading(true)
                const data = await getPropertiesComponent(currentPath, componentName)
                setPropsComponent(data)

                const deepMerge = (target: any, source: any): any => {
                    const result = { ...target }

                    for (const key in source) {
                        if (
                            source[key] instanceof Object &&
                            key in target &&
                            target[key] instanceof Object
                        ) {
                            result[key] = deepMerge(target[key], source[key])
                        } else {
                            result[key] = source[key]
                        }
                    }

                    return result
                }

                const target = Object.entries(data ?? {}).reduce(
                    (acc, [key, config]) => {
                        if (config.type === 'object' && config.properties) {
                            acc[key] = Object.entries(config.properties).reduce(
                                (objAcc, [propKey, propConfig]: [string, any]) => {
                                    if (
                                        propConfig.default !== undefined ||
                                        propConfig.required
                                    ) {
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
                const source = Object.entries(currentComp?.properties ?? {}).reduce(
                    (acc, [key, value]) => {
                        const schemaConfig = (data as Record<string, any>)?.[key]

                        if (!schemaConfig) {
                            return acc
                        }

                        if (schemaConfig.type === 'object' && schemaConfig.properties) {
                            const filteredNestedProps = Object.entries(value || {}).reduce(
                                (nestedAcc, [nestedKey, nestedValue]) => {
                                    const nestedConfig = schemaConfig.properties[nestedKey]
                                    if (
                                        nestedConfig &&
                                        (nestedConfig.required || nestedValue !== undefined)
                                    ) {
                                        nestedAcc[nestedKey] = nestedValue
                                    }
                                    return nestedAcc
                                },
                                {} as Record<string, any>
                            )

                            if (Object.keys(filteredNestedProps).length > 0) {
                                acc[key] = filteredNestedProps
                            }
                        } else if (schemaConfig.required || value !== undefined) {
                            acc[key] = value
                        }

                        return acc
                    },
                    {} as Record<string, any>
                )

                const initialValues = deepMerge(target, source)

                setTempEditingComponent(
                    (prev) =>
                        ({
                            ...currentComp,
                            ...prev,
                            properties: initialValues
                        }) as StructuredComponent
                )
            } catch (error) {
                console.error('Error loading properties component:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadProps()
    }, [componentId, componentName, currentPath, currentComp])

    // Load child properties component
    useEffect(() => {
        if (!componentName) return

        const loadProps = async () => {
            try {
                const data = await getChildPropertiesComponent(currentPath, componentName)
                setPropsComponentChild(data && !Array.isArray(data) ? data : {})

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
    const setNestedValue = useCallback(
        (
            obj: Record<string, any>,
            path: string[],
            val: string | boolean | number
        ): Record<string, string | boolean | number | undefined> => {
            const [first, ...rest] = path
            if (rest.length === 0) {
                return { ...obj, [first]: val }
            }
            return {
                ...obj,
                [first]: setNestedValue(obj[first] || {}, rest, val)
            }
        },
        []
    )

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
    }, [currentComp, componentId, handleUpdateChildComponent])

    const handleClose = useCallback(() => {
        clearEditingComponent()
    }, [clearEditingComponent])

    const handleTagChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        if (!componentId) return
        setTempEditingComponent(
            (prev) =>
                ({
                    ...prev,
                    tag: e.target.value
                }) as StructuredComponent
        )
    }, [componentId])

    const handleUseClientChange = useCallback((useClient: boolean): void => {
        if (!componentId) return
        setAllRestData({ ...restData, useClient })
    }, [componentId, restData, setAllRestData])

    const handleSelectState = useCallback(
        (field: string, state: State | undefined, value: DataValue | undefined) => {
            if (!componentId) return

            const updatedData = { ...tempEditingComponent?.data }
            delete updatedData[field]

            if (state) {
                updatedData[field] = { state }
            }

            if (value) {
                updatedData[field] = { value }
            }

            setTempEditingComponent(
                (prev) =>
                    ({
                        ...prev,
                        data: updatedData
                    }) as StructuredComponent
            )
        },
        [componentId, tempEditingComponent]
    )

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
            <SidebarRightHeader
                componentName={componentName}
                showActions={!comp}
                onReset={resetTempData}
                onClose={handleClose}
            />
            <IGRPSidebarContentPrimitive>
                <div className="space-y-4 p-2 px-3">
                    {isLoading ? (
                        <Loader />
                    ) : !tempEditingComponent ? (
                        <EmptyList
                            icon={<Settings />}
                            title={t('settingsComponents')}
                            description={t('selectComponentToEdit')}
                        />
                    ) : (
                        <>
                            <ComponentIdentitySection
                                label={label}
                                componentName={componentName}
                                componentId={componentId}
                                tag={tempEditingComponent.tag}
                                isRootComponent={isRootComponent}
                                useClient={restData?.useClient ?? true}
                                onTagChange={handleTagChange}
                                onUseClientChange={handleUseClientChange}
                            />
                            <IGRPTabsPrimitive className="flex-1" defaultValue="props">
                                <IGRPTabsListPrimitive className="grid w-full grid-cols-4">
                                    <IGRPTabsTriggerPrimitive value="props">
                                        {t('props')}
                                    </IGRPTabsTriggerPrimitive>
                                    <IGRPTabsTriggerPrimitive value="styles">
                                        {t('style')}
                                    </IGRPTabsTriggerPrimitive>
                                    <IGRPTabsTriggerPrimitive value="interactions">
                                        {t('interactions')}
                                    </IGRPTabsTriggerPrimitive>
                                    <IGRPTabsTriggerPrimitive value="copy-content">
                                        {t('copy')}
                                    </IGRPTabsTriggerPrimitive>
                                </IGRPTabsListPrimitive>

                                <IGRPTabsContentPrimitive value="props" className="space-y-6">
                                    <PropertiesPanel
                                        propsComponent={propsComponent}
                                        propsComponentChild={propsComponentChild}
                                        tempEditingComponent={tempEditingComponent}
                                        childformValues={childformValues}
                                        pageOptions={pageOptions}
                                        statesOptions={statesOptions}
                                        columnsOptions={columnsOptions}
                                        onComponentPropertyChange={handleComponentPropertyChange}
                                        onChildPropertyChange={handleChildPropertyChange}
                                        onSelectState={handleSelectState}
                                    />
                                </IGRPTabsContentPrimitive>
                                <IGRPTabsContentPrimitive value="styles" className="space-y-6">
                                    <StyleTab
                                        comp={tempEditingComponent}
                                        path={currentPath}
                                        onInteranctionsChange={handleUpdateChildComponent}
                                    />
                                </IGRPTabsContentPrimitive>
                                <IGRPTabsContentPrimitive
                                    value="interactions"
                                    className="space-y-6"
                                >
                                    <Interactions
                                        comp={tempEditingComponent}
                                        path={currentPath}
                                        onInteranctionsChange={handleUpdateChildComponent}
                                        columnsOptions={columnsOptions}
                                    />
                                </IGRPTabsContentPrimitive>
                                <IGRPTabsContentPrimitive
                                    value="copy-content"
                                    className="space-y-6"
                                >
                                    <CopyContent currentComp={currentComp} />
                                </IGRPTabsContentPrimitive>
                            </IGRPTabsPrimitive>
                        </>
                    )}
                </div>
            </IGRPSidebarContentPrimitive>
        </IGRPSidebarPrimitive>
    )
}

export default memo(SidebarRight)
