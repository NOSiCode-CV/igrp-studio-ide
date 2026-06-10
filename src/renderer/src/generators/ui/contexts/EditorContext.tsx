import type {
    Arguments,
    CustomFunctionConfig,
    Import,
    State,
    TypeDef
} from '@igrp/igrp-studio-nextjs-engine/types'
import type {
    Destination,
    DroppedComponentsContextType,
    EditingComponentParams,
    StructuredComponent,
    StructuredLayout
} from '@renderer/lib/dnd/types'
import type React from 'react'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

const DroppedComponentsContext = createContext<DroppedComponentsContextType | undefined>(undefined)

const emptyComponents: StructuredComponent = {
    id: '',
    tag: '',
    componentName: '',
    label: '',
    type: '',
    properties: {},
    interactions: {},
    children: []
}

/**
 * Per-instance editor store. One `DroppedComponentsProvider` is mounted PER TAB
 * (inside the tabs map), so each open page owns an independent React state tree.
 * Hidden tabs keep their state untouched; closing a tab unmounts its provider
 * and the state is garbage-collected. This is the isolation model — there is no
 * shared "active tab" slice, by design (a single shared store previously leaked
 * edits across tabs).
 */
export const DroppedComponentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [components, setComponents] = useState<StructuredComponent>({
        ...emptyComponents,
        children: []
    })
    const [types, setTypes] = useState<TypeDef[]>([])
    const [functions, setFunctions] = useState<CustomFunctionConfig[]>([])
    const [states, setStates] = useState<State[]>([])
    const [imports, setImports] = useState<Import[]>([])
    const [componentArguments, setComponentArguments] = useState<Arguments[]>([])
    const [currentComponent, setCurrentComponent] = useState<EditingComponentParams | null>(null)
    const [restData, setRestData] = useState<any>({})

    // ----- components ---------------------------------------------------------
    const setAllComponents = useCallback((components: StructuredLayout) => {
        setComponents(components as StructuredComponent)
    }, [])

    const handleAddChildToComponent = useCallback(
        (destination: Destination, childComponent: StructuredComponent) => {
            if (!childComponent || !destination || !destination.droppableId) {
                console.error('Invalid child component or destination')
                return
            }

            const updateComponentTree = (component: StructuredComponent): StructuredComponent => {
                if (component.id === destination.droppableId) {
                    const updatedChildren = [...(component.children || [])]
                    updatedChildren.splice(destination.index, 0, childComponent)
                    return { ...component, children: updatedChildren }
                }
                if (component.children) {
                    return { ...component, children: component.children.map(updateComponentTree) }
                }
                return component
            }

            setComponents((prev) => updateComponentTree(prev))
        },
        []
    )

    const handleReorderChildInComponent = useCallback(
        (_draggableId: string, source: Destination, destination: Destination) => {
            if (!source || !destination || !source.droppableId || !destination.droppableId) {
                console.error('Invalid source or destination')
                return
            }

            setComponents((prev) => {
                let movedComponent: StructuredComponent | null = null

                const removeComponentFromSource = (
                    component: StructuredComponent
                ): StructuredComponent => {
                    if (component.id === source.droppableId) {
                        const updatedChildren = [...(component.children || [])]
                        ;[movedComponent] = updatedChildren.splice(source.index, 1)
                        return { ...component, children: updatedChildren }
                    }
                    if (component.children) {
                        return {
                            ...component,
                            children: component.children.map(removeComponentFromSource)
                        }
                    }
                    return component
                }

                const insertComponentIntoDestination = (
                    component: StructuredComponent
                ): StructuredComponent => {
                    if (component.id === destination.droppableId) {
                        const updatedChildren = [...(component.children || [])]
                        if (movedComponent) {
                            updatedChildren.splice(destination.index, 0, movedComponent)
                        }
                        return { ...component, children: updatedChildren }
                    }
                    if (component.children) {
                        return {
                            ...component,
                            children: component.children.map(insertComponentIntoDestination)
                        }
                    }
                    return component
                }

                const afterRemoval = removeComponentFromSource(prev)
                return insertComponentIntoDestination(afterRemoval)
            })
        },
        []
    )

    const handleRemoveChildFromComponent = useCallback((destination: Destination) => {
        if (!destination || !destination.droppableId) {
            console.error('Invalid destination')
            return
        }

        const updateComponentTree = (
            component: StructuredComponent
        ): StructuredComponent | null => {
            if (component.id === destination.droppableId) return null
            if (component.children) {
                const updatedChildren = component.children
                    .map(updateComponentTree)
                    .filter((c): c is StructuredComponent => c !== null)
                return { ...component, children: updatedChildren }
            }
            return component
        }

        setComponents((prev) => ({
            ...prev,
            children: (prev.children || [])
                .map(updateComponentTree)
                .filter((c): c is StructuredComponent => c !== null)
        }))
        setCurrentComponent(null)
    }, [])

    const handleUpdateChildComponent = useCallback(
        (componentId: string, updates: Partial<StructuredComponent>) => {
            if (!componentId || !updates) {
                console.error('Invalid component ID or updates')
                return
            }

            setComponents((prev) => {
                if (prev.id === componentId) {
                    return { ...prev, ...updates }
                }

                const updateComponentTree = (
                    component: StructuredComponent
                ): StructuredComponent => {
                    if (component.id === componentId) return { ...component, ...updates }
                    if (component.children) {
                        return {
                            ...component,
                            children: component.children.map(updateComponentTree)
                        }
                    }
                    return component
                }

                return {
                    ...prev,
                    children: (prev.children || []).map(updateComponentTree)
                }
            })
        },
        []
    )

    const removeRow = useCallback((rowId: string) => {
        setComponents((prev) => ({
            ...prev,
            children: (prev.children || []).filter((row) => row.id !== rowId)
        }))
    }, [])

    // ----- editing component --------------------------------------------------
    const setEditingComponent = useCallback(({ path, component }: EditingComponentParams) => {
        // Selecting a component only opens the Settings panel. We intentionally
        // do NOT collapse the left palette anymore — both panels can stay open
        // and the canvas shrinks + scrolls horizontally to fit (docked-panels
        // pattern). The user controls each sidebar.
        setCurrentComponent({ path, component })
    }, [])

    const clearEditingComponent = useCallback(() => {
        setCurrentComponent(null)
    }, [])

    // ----- types --------------------------------------------------------------
    const addType = useCallback((type: TypeDef) => {
        setTypes((prev) => [...prev, type])
    }, [])

    const updateType = useCallback((id: string, updates: Partial<TypeDef>) => {
        setTypes((prev) => prev.map((t) => (t.componentId === id ? { ...t, ...updates } : t)))
    }, [])

    const removeType = useCallback((id: string) => {
        setTypes((prev) => prev.filter((t) => t.componentId !== id))
    }, [])

    const createOrUpdateType = useCallback((newType: TypeDef) => {
        setTypes((prev) => {
            const idx = prev.findIndex((t) => t.componentId === newType.componentId)
            if (idx !== -1) {
                const updated = [...prev]
                updated[idx] = newType
                return updated
            }
            return [...prev, newType]
        })
    }, [])

    const getTypeByComponentId = useCallback(
        (componentId: string): TypeDef | undefined =>
            types.find((t) => t.componentId === componentId),
        [types]
    )

    const setAllTypes = useCallback((newTypes: TypeDef[]) => {
        setTypes(Array.isArray(newTypes) ? newTypes : [])
    }, [])

    // ----- functions ----------------------------------------------------------
    const addFunction = useCallback((fnc: CustomFunctionConfig) => {
        setFunctions((prev) => [...(prev ?? []), fnc])
    }, [])

    const updateFunction = useCallback((id: string, updates: Partial<CustomFunctionConfig>) => {
        setFunctions((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
    }, [])

    const removeFunction = useCallback((id: string) => {
        setFunctions((prev) => prev.filter((f) => f.id !== id))
    }, [])

    const setAllFunctions = useCallback((fncs: CustomFunctionConfig[]) => {
        setFunctions(Array.isArray(fncs) ? fncs : [])
    }, [])

    // ----- states -------------------------------------------------------------
    const addState = useCallback((state: State) => {
        setStates((prev) => {
            const list = prev ?? []
            const idx = list.findIndex((s) => s.name === state.name)
            if (idx !== -1) {
                console.warn(
                    `State with name "${state.name}" already exists. Replacing existing state.`
                )
                const updated = [...list]
                updated[idx] = state
                return updated
            }
            return [...list, state]
        })
    }, [])

    const updateState = useCallback((id: string, updates: Partial<State>) => {
        setStates((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
    }, [])

    const removeState = useCallback((id: string) => {
        setStates((prev) => prev.filter((s) => s.id !== id))
    }, [])

    const setAllStates = useCallback((newStates: State[]) => {
        setStates(Array.isArray(newStates) ? newStates : [])
    }, [])

    // ----- imports ------------------------------------------------------------
    const addImport = useCallback((importPath: Import) => {
        setImports((prev) => [...(prev ?? []), importPath])
    }, [])

    const updateImport = useCallback((id: string, updates: Partial<Import>) => {
        setImports((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
    }, [])

    const removeImport = useCallback((id: string) => {
        setImports((prev) => prev.filter((i) => i.id !== id))
    }, [])

    const setAllImports = useCallback((newImports: Import[]) => {
        setImports(Array.isArray(newImports) ? newImports : [])
    }, [])

    // ----- arguments / restData ----------------------------------------------
    const setAllArguments = useCallback((args: Arguments[]) => {
        setComponentArguments(Array.isArray(args) ? args : [])
    }, [])

    const setAllRestData = useCallback((data: any) => {
        setRestData(data)
    }, [])

    const value = useMemo<DroppedComponentsContextType>(
        () => ({
            setAllComponents,
            handleAddChildToComponent,
            handleRemoveChildFromComponent,
            handleReorderChildInComponent,
            handleUpdateChildComponent,
            removeRow,
            setEditingComponent,
            clearEditingComponent,

            addType,
            updateType,
            removeType,
            createOrUpdateType,
            getTypeByComponentId,
            setAllTypes,

            addFunction,
            updateFunction,
            removeFunction,
            setAllFunctions,

            addState,
            updateState,
            removeState,
            setAllStates,

            addImport,
            updateImport,
            removeImport,
            setAllImports,

            components,
            currentComponent,
            types,
            functions,
            states,
            imports,

            setAllArguments,
            componentArguments,
            setAllRestData,
            restData
        }),
        [
            components,
            currentComponent,
            types,
            functions,
            states,
            imports,
            componentArguments,
            restData,
            setAllComponents,
            handleAddChildToComponent,
            handleRemoveChildFromComponent,
            handleReorderChildInComponent,
            handleUpdateChildComponent,
            removeRow,
            setEditingComponent,
            clearEditingComponent,
            addType,
            updateType,
            removeType,
            createOrUpdateType,
            getTypeByComponentId,
            setAllTypes,
            addFunction,
            updateFunction,
            removeFunction,
            setAllFunctions,
            addState,
            updateState,
            removeState,
            setAllStates,
            addImport,
            updateImport,
            removeImport,
            setAllImports,
            setAllArguments,
            setAllRestData
        ]
    )

    return (
        <DroppedComponentsContext.Provider value={value}>
            {children}
        </DroppedComponentsContext.Provider>
    )
}

export const useDroppedComponents = (): DroppedComponentsContextType => {
    const context = useContext(DroppedComponentsContext)
    if (context === undefined) {
        throw new Error('useDroppedComponents must be used within a DroppedComponentsProvider')
    }
    return context
}
