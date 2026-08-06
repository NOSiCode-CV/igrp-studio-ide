import { useSidebar } from '@renderer/components/ui/sidebar'
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

interface TabSlice {
    components: StructuredComponent
    types: TypeDef[]
    functions: CustomFunctionConfig[]
    states: State[]
    imports: Import[]
    componentArguments: Arguments[]
    currentComponent: EditingComponentParams | null
    restData: any
}

const emptyTabSlice = (): TabSlice => ({
    components: { ...emptyComponents, children: [] },
    types: [],
    functions: [],
    states: [],
    imports: [],
    componentArguments: [],
    currentComponent: null,
    restData: {}
})

interface ProviderProps {
    children: ReactNode
    activeTabId: string
}

/**
 * Single provider for all tabs. Keeps a per-tab slice keyed by `activeTabId`.
 * Selectors and setters in `useDroppedComponents()` always operate on the
 * currently active tab's slice; switching tabs is just an `activeTabId` change.
 */
export const DroppedComponentsProvider: React.FC<ProviderProps> = ({ children, activeTabId }) => {
    const { toggleSidebar, setOpen } = useSidebar()

    const [byTab, setByTab] = useState<Record<string, TabSlice>>({})

    const slice = byTab[activeTabId] ?? emptyTabSlice()

    const updateSlice = useCallback((tabId: string, updater: (prev: TabSlice) => TabSlice) => {
        setByTab((prev) => {
            const current = prev[tabId] ?? emptyTabSlice()
            return { ...prev, [tabId]: updater(current) }
        })
    }, [])

    const updateActive = useCallback(
        (updater: (prev: TabSlice) => TabSlice) => updateSlice(activeTabId, updater),
        [activeTabId, updateSlice]
    )

    // ----- components ---------------------------------------------------------
    const setAllComponents = useCallback(
        (components: StructuredLayout) => {
            updateActive((prev) => ({ ...prev, components: components as StructuredComponent }))
        },
        [updateActive]
    )

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
                    return {
                        ...component,
                        children: component.children.map(updateComponentTree)
                    }
                }
                return component
            }

            updateActive((prev) => ({
                ...prev,
                components: updateComponentTree(prev.components)
            }))
        },
        [updateActive]
    )

    const handleReorderChildInComponent = useCallback(
        (_draggableId: string, source: Destination, destination: Destination) => {
            if (!source || !destination || !source.droppableId || !destination.droppableId) {
                console.error('Invalid source or destination')
                return
            }

            updateActive((prev) => {
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

                const afterRemoval = removeComponentFromSource(prev.components)
                const afterInsert = insertComponentIntoDestination(afterRemoval)
                return { ...prev, components: afterInsert }
            })
        },
        [updateActive]
    )

    const handleRemoveChildFromComponent = useCallback(
        (destination: Destination) => {
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

            updateActive((prev) => ({
                ...prev,
                components: {
                    ...prev.components,
                    children: (prev.components.children || [])
                        .map(updateComponentTree)
                        .filter((c): c is StructuredComponent => c !== null)
                },
                currentComponent: null
            }))
        },
        [updateActive]
    )

    const handleUpdateChildComponent = useCallback(
        (componentId: string, updates: Partial<StructuredComponent>) => {
            if (!componentId || !updates) {
                console.error('Invalid component ID or updates')
                return
            }

            updateActive((prev) => {
                if (prev.components.id === componentId) {
                    return {
                        ...prev,
                        components: { ...prev.components, ...updates }
                    }
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
                    components: {
                        ...prev.components,
                        children: (prev.components.children || []).map(updateComponentTree)
                    }
                }
            })
        },
        [updateActive]
    )

    const removeRow = useCallback(
        (rowId: string) => {
            updateActive((prev) => ({
                ...prev,
                components: {
                    ...prev.components,
                    children: (prev.components.children || []).filter((row) => row.id !== rowId)
                }
            }))
        },
        [updateActive]
    )

    // ----- editing component --------------------------------------------------
    const setEditingComponent = useCallback(
        ({ path, component }: EditingComponentParams) => {
            updateActive((prev) => ({
                ...prev,
                currentComponent: { path, component }
            }))
            toggleSidebar()
            setOpen(false)
        },
        [updateActive, toggleSidebar, setOpen]
    )

    const clearEditingComponent = useCallback(() => {
        updateActive((prev) => ({ ...prev, currentComponent: null }))
    }, [updateActive])

    // ----- types --------------------------------------------------------------
    const addType = useCallback(
        (type: TypeDef) => {
            updateActive((prev) => ({ ...prev, types: [...prev.types, type] }))
        },
        [updateActive]
    )

    const updateType = useCallback(
        (id: string, updates: Partial<TypeDef>) => {
            updateActive((prev) => ({
                ...prev,
                types: prev.types.map((t) => (t.componentId === id ? { ...t, ...updates } : t))
            }))
        },
        [updateActive]
    )

    const removeType = useCallback(
        (id: string) => {
            updateActive((prev) => ({
                ...prev,
                types: prev.types.filter((t) => t.componentId !== id)
            }))
        },
        [updateActive]
    )

    const createOrUpdateType = useCallback(
        (newType: TypeDef) => {
            updateActive((prev) => {
                const idx = prev.types.findIndex((t) => t.componentId === newType.componentId)
                if (idx !== -1) {
                    const updated = [...prev.types]
                    updated[idx] = newType
                    return { ...prev, types: updated }
                }
                return { ...prev, types: [...prev.types, newType] }
            })
        },
        [updateActive]
    )

    const getTypeByComponentId = useCallback(
        (componentId: string): TypeDef | undefined =>
            slice.types.find((t) => t.componentId === componentId),
        [slice.types]
    )

    const setAllTypes = useCallback(
        (newTypes: TypeDef[]) => {
            updateActive((prev) => ({
                ...prev,
                types: Array.isArray(newTypes) ? newTypes : []
            }))
        },
        [updateActive]
    )

    // ----- functions ----------------------------------------------------------
    const addFunction = useCallback(
        (fnc: CustomFunctionConfig) => {
            updateActive((prev) => ({
                ...prev,
                functions: [...(prev.functions ?? []), fnc]
            }))
        },
        [updateActive]
    )

    const updateFunction = useCallback(
        (id: string, updates: Partial<CustomFunctionConfig>) => {
            updateActive((prev) => ({
                ...prev,
                functions: prev.functions.map((f) => (f.id === id ? { ...f, ...updates } : f))
            }))
        },
        [updateActive]
    )

    const removeFunction = useCallback(
        (id: string) => {
            updateActive((prev) => ({
                ...prev,
                functions: prev.functions.filter((f) => f.id !== id)
            }))
        },
        [updateActive]
    )

    const setAllFunctions = useCallback(
        (fncs: CustomFunctionConfig[]) => {
            updateActive((prev) => ({
                ...prev,
                functions: Array.isArray(fncs) ? fncs : []
            }))
        },
        [updateActive]
    )

    // ----- states -------------------------------------------------------------
    const addState = useCallback(
        (state: State) => {
            updateActive((prev) => {
                const list = prev.states ?? []
                const idx = list.findIndex((s) => s.name === state.name)
                if (idx !== -1) {
                    console.warn(
                        `State with name "${state.name}" already exists. Replacing existing state.`
                    )
                    const updated = [...list]
                    updated[idx] = state
                    return { ...prev, states: updated }
                }
                return { ...prev, states: [...list, state] }
            })
        },
        [updateActive]
    )

    const updateState = useCallback(
        (id: string, updates: Partial<State>) => {
            updateActive((prev) => ({
                ...prev,
                states: prev.states.map((s) => (s.id === id ? { ...s, ...updates } : s))
            }))
        },
        [updateActive]
    )

    const removeState = useCallback(
        (id: string) => {
            updateActive((prev) => ({
                ...prev,
                states: prev.states.filter((s) => s.id !== id)
            }))
        },
        [updateActive]
    )

    const setAllStates = useCallback(
        (states: State[]) => {
            updateActive((prev) => ({
                ...prev,
                states: Array.isArray(states) ? states : []
            }))
        },
        [updateActive]
    )

    // ----- imports ------------------------------------------------------------
    const addImport = useCallback(
        (importPath: Import) => {
            updateActive((prev) => ({
                ...prev,
                imports: [...(prev.imports ?? []), importPath]
            }))
        },
        [updateActive]
    )

    const updateImport = useCallback(
        (id: string, updates: Partial<Import>) => {
            updateActive((prev) => ({
                ...prev,
                imports: prev.imports.map((i) => (i.id === id ? { ...i, ...updates } : i))
            }))
        },
        [updateActive]
    )

    const removeImport = useCallback(
        (id: string) => {
            updateActive((prev) => ({
                ...prev,
                imports: prev.imports.filter((i) => i.id !== id)
            }))
        },
        [updateActive]
    )

    const setAllImports = useCallback(
        (imports: Import[]) => {
            updateActive((prev) => ({
                ...prev,
                imports: Array.isArray(imports) ? imports : []
            }))
        },
        [updateActive]
    )

    // ----- arguments / restData ----------------------------------------------
    const setAllArguments = useCallback(
        (args: Arguments[]) => {
            updateActive((prev) => ({
                ...prev,
                componentArguments: Array.isArray(args) ? args : []
            }))
        },
        [updateActive]
    )

    const setAllRestData = useCallback(
        (restData: any) => {
            updateActive((prev) => ({ ...prev, restData }))
        },
        [updateActive]
    )

    // ----- tab lifecycle ------------------------------------------------------
    const removeTab = useCallback((tabId: string) => {
        setByTab((prev) => {
            if (!(tabId in prev)) return prev
            const next = { ...prev }
            delete next[tabId]
            return next
        })
    }, [])

    const value = useMemo<DroppedComponentsContextType>(
        () =>
            ({
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

                components: slice.components,
                currentComponent: slice.currentComponent,
                types: slice.types,
                functions: slice.functions,
                states: slice.states,
                imports: slice.imports,

                setAllArguments,
                componentArguments: slice.componentArguments,
                setAllRestData,
                restData: slice.restData,

                // New API for tab cleanup. Cast through unknown to keep external
                // type compatibility while consumers can opt-in.
                removeTab
            }) as DroppedComponentsContextType & { removeTab: (tabId: string) => void },
        [
            slice,
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
            setAllRestData,
            removeTab
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

/**
 * Escape hatch for callers that need to drop a tab's slice (e.g. TabContext on
 * close). Cast at the call site since `removeTab` is appended to the context
 * object outside the public type.
 */
export const useDroppedComponentsAdmin = (): { removeTab: (tabId: string) => void } => {
    const context = useContext(DroppedComponentsContext) as
        | (DroppedComponentsContextType & { removeTab: (tabId: string) => void })
        | undefined
    if (context === undefined) {
        throw new Error('useDroppedComponentsAdmin must be used within a DroppedComponentsProvider')
    }
    return { removeTab: context.removeTab }
}
