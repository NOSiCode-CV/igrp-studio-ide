import type { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system'
import type { State } from '@igrp/igrp-studio-nextjs-engine/types'
import useStudio from '@renderer/hooks/use-studio'
import useToast from '@renderer/hooks/useToast'
import type { DataValue, StructuredComponent } from '@renderer/lib/dnd/types'
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDroppedComponents } from '../contexts/EditorContext'
import { getRequiredDataSchema } from '../dnd/helpers'
import { getSwitchTargets, switchComponentType } from '../utils/switchComponentType'
import { useComponents } from './useComponents'

interface UseSidebarRightStateArgs {
    comp?: StructuredComponent
    parentComp?: StructuredComponent
    path?: string
}

const deepMerge = (target: any, source: any): any => {
    const result = { ...target }
    for (const key in source) {
        if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
            result[key] = deepMerge(target[key], source[key])
        } else {
            result[key] = source[key]
        }
    }
    return result
}

const setNestedValue = (
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
}

/**
 * Encapsulates the data-loading effects, derived state and handlers used by
 * SidebarRight. Keeps the orchestrator component focused on layout.
 */
export function useSidebarRightState({ comp, parentComp, path }: UseSidebarRightStateArgs) {
    const {
        getPropertiesComponent,
        getDataComponent,
        getChildPropertiesComponent,
        componentsRegistered
    } = useStudio()
    const {
        currentComponent: editingComponentParams,
        handleUpdateChildComponent,
        clearEditingComponent,
        setEditingComponent,
        setAllRestData,
        restData
    } = useDroppedComponents()
    const { showWarningToast } = useToast()
    const { t } = useTranslation()
    const { getArqumentsOptions } = useComponents()
    const argumentsOptions = getArqumentsOptions()

    const currentComp = useMemo(
        () => comp || editingComponentParams?.component,
        [comp, editingComponentParams]
    )

    const isRootComponent = useMemo(
        () =>
            currentComp?.componentName === 'page' ||
            currentComp?.componentName === 'component' ||
            currentComp?.componentName === 'processStep',
        [currentComp]
    )

    const currentPath = path || editingComponentParams?.path || ''

    const { label, data, componentName, childProperties = {}, id: componentId } = currentComp || {}

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

    // Build column options from parent + page arguments
    useEffect(() => {
        const options =
            parentComp?.children
                .filter(
                    (column) =>
                        column?.properties?.dataProperties &&
                        !column.properties.dataProperties.isVirtual &&
                        column.properties.dataProperties.isType
                )
                .map((column) => ({
                    value: column.tag,
                    label: column.properties.headerTitle,
                    type: 'column' as const
                })) ?? []

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

    // Load properties + data schema for the current component
    useEffect(() => {
        if (!componentId || !componentName) return

        setTempEditingComponent(undefined)

        getDataComponent(currentPath, componentName).then((response) => {
            const requiredDataSchema = getRequiredDataSchema(response)

            if (data && requiredDataSchema) {
                const cleanedData = { ...data }

                Object.keys(requiredDataSchema).forEach((key) => {
                    if (!(key in data)) {
                        cleanedData[key] = requiredDataSchema[key]
                    }
                })

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
                const props = await getPropertiesComponent(currentPath, componentName)
                setPropsComponent(props)

                const target = Object.entries(props ?? {}).reduce(
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
                const source = Object.entries(currentComp?.properties ?? {}).reduce(
                    (acc, [key, value]) => {
                        const schemaConfig = (props as Record<string, any>)?.[key]

                        if (!schemaConfig) return acc

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

    // Load child properties for the current component
    useEffect(() => {
        if (!componentName) return

        const loadProps = async () => {
            try {
                const childProps = await getChildPropertiesComponent(currentPath, componentName)
                setPropsComponentChild(childProps && !Array.isArray(childProps) ? childProps : {})

                const initialValues = Object.entries(childProps ?? {}).reduce(
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

    // Push tempEditingComponent changes back to dropped components store
    useEffect(() => {
        if (!componentId || tempEditingComponent?.id !== componentId) return
        handleUpdateChildComponent(componentId, { ...tempEditingComponent })
    }, [tempEditingComponent, componentId])

    useEffect(() => {
        if (!componentId) return
        handleUpdateChildComponent(componentId, { childProperties: { ...childformValues } })
    }, [childformValues, componentId])

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
        []
    )

    const handleChildPropertyChange = useCallback((fieldPath: string, value: string | boolean) => {
        setChildformValues((prev) => setNestedValue(prev, fieldPath.split('.'), value))
    }, [])

    const resetTempData = useCallback(() => {
        if (!componentId) return
        handleUpdateChildComponent(componentId, { ...currentComp })
    }, [currentComp, componentId, handleUpdateChildComponent])

    const handleClose = useCallback(() => {
        clearEditingComponent()
    }, [clearEditingComponent])

    const handleTagChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>): void => {
            if (!componentId) return
            setTempEditingComponent(
                (prev) =>
                    ({
                        ...prev,
                        tag: e.target.value
                    }) as StructuredComponent
            )
        },
        [componentId]
    )

    const handleUseClientChange = useCallback(
        (useClient: boolean): void => {
            if (!componentId) return
            setAllRestData({ ...restData, useClient })
        },
        [componentId, restData, setAllRestData]
    )

    const handleSelectState = useCallback(
        (field: string, state: State | undefined, value: DataValue | undefined) => {
            if (!componentId) return

            const updatedData = { ...tempEditingComponent?.data }
            delete updatedData[field]

            if (state) updatedData[field] = { state }
            if (value) updatedData[field] = { value }

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

    /**
     * Partial updates (interactions, rules, styles) must go through
     * tempEditingComponent so the sync effect doesn't overwrite them with a
     * stale snapshot. Empty `rules` omits the key from the node JSON.
     */
    const handlePartialComponentUpdate = useCallback(
        (id: string, updates: Partial<StructuredComponent>) => {
            if (!id) return
            setTempEditingComponent((prev) => {
                if (!prev || prev.id !== id) return prev
                const next: StructuredComponent = { ...prev, ...updates }
                if ('rules' in updates && (!updates.rules || updates.rules.length === 0)) {
                    delete next.rules
                }
                return next
            })
        },
        []
    )

    // "Switch component" — convert the editing component to a same-group
    // sibling in place (keep id/tag/label + every value the target schema
    // accepts). Updating the store AND the editing selection makes the
    // schema-loading effects above reload the panel for the new type.
    const switchTargets = useMemo(
        () => (isRootComponent ? [] : getSwitchTargets(componentsRegistered, currentComp)),
        [componentsRegistered, currentComp, isRootComponent]
    )

    const handleSwitchComponent = useCallback(
        (targetName: string) => {
            if (!componentId || !currentComp) return
            const target = componentsRegistered.find((entry) => entry.name === targetName)
            if (!target) return

            const { component: converted, droppedKeys } = switchComponentType(currentComp, target)

            handleUpdateChildComponent(componentId, converted)
            setEditingComponent({ path: currentPath, component: converted })

            if (droppedKeys.length > 0) {
                showWarningToast(
                    t('switchComponentDroppedProps', {
                        keys: droppedKeys.join(', '),
                        defaultValue: `Properties not supported by the new component were removed: ${droppedKeys.join(', ')}`
                    })
                )
            }
        },
        [
            componentId,
            currentComp,
            componentsRegistered,
            currentPath,
            handleUpdateChildComponent,
            setEditingComponent,
            showWarningToast,
            t
        ]
    )

    return {
        // derived
        currentComp,
        currentPath,
        isRootComponent,
        label,
        componentName,
        componentId,
        switchTargets,
        handleSwitchComponent,
        // state
        tempEditingComponent,
        propsComponent,
        propsComponentChild,
        childformValues,
        columnsOptions,
        isLoading,
        // handlers
        handleComponentPropertyChange,
        handleChildPropertyChange,
        handleSelectState,
        handlePartialComponentUpdate,
        handleTagChange,
        handleUseClientChange,
        resetTempData,
        handleClose,
        // dropped components passthroughs (for tabs that need them downstream)
        handleUpdateChildComponent,
        restData
    }
}
