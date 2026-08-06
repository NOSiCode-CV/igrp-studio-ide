/**
 * UI-generator façade over `@renderer/features/dnd`.
 *
 * Re-exports the generic DnD types and adds the `StructuredComponent`
 * manifest model used by the visual page builder. New generators should
 * either reuse `StructuredComponent` (when their manifest matches) or
 * import the generic primitives from `@renderer/features/dnd` directly
 * with their own typed adapter.
 */

import type {
    Arguments,
    ComponentRegisterConfig,
    CustomFunctionConfig,
    Import,
    RegisterState,
    RuleDefinition,
    State,
    TypeDef
} from '@igrp/igrp-studio-nextjs-engine/types'
import type { StyleComponent } from '@renderer/generators/ui/components/settings/style/types'
import type {
    DragEndResult as GenericDragEndResult,
    Destination,
    DropPosition,
    DropZone,
    LayoutMode,
    SidebarItem,
    Source as GenericSource
} from '@renderer/features/dnd/types'

export type { Destination, DropPosition, DropZone, LayoutMode, SidebarItem }

export interface ComponentConfig {
    gridCol?: number
    type?: string
    name?: string
    label?: string
    placeholder?: string
    colSize?: number
    [key: string]: any
}

export interface DataValue {
    code: string
    id: string
}

export interface StructuredComponent {
    useClient?: boolean
    deprecated?: boolean
    id: string
    componentName: string
    tag: string
    label?: string
    type?: string
    allowTypes?: boolean
    dataType?: string
    properties: {
        className?: string
        content?: string
        [key: string]: any
    }
    childProperties?: {
        [key: string]: any
    }
    interactions: {
        [key: string]: any
    }
    dataProperties?: {
        [key: string]: any
    }
    children: StructuredComponent[]
    data?: {
        [key: string]: {
            state?: State
            value?: DataValue
        }
    }
    rules?: RuleDefinition[]
    style?: StyleComponent
}

export type StructuredLayout = StructuredComponent

/**
 * UI-generator extension of the generic `Source` carrying manifest fields
 * (`childrenTypes`, `defaultChildren`, `data`) that the visual page builder
 * consumes after a drop.
 */
export interface Source extends GenericSource {
    label: string
    properties: {
        className?: string
        content?: string
        [key: string]: any
    }
    childrenTypes?: ComponentRegisterConfig[]
    defaultChildren?: { name: string }[]
    interactions: {
        [key: string]: any
    }
    allowTypes: boolean
    data?: RegisterState[]
    componentName?: string
}

/**
 * UI-generator drag end result. Pins the source type to the manifest-aware
 * `Source` above so existing consumers keep their typing without churn.
 */
export interface DragEndResult extends Omit<GenericDragEndResult, 'source'> {
    source: Source
}

export interface EditingComponentParams {
    path?: string
    component: StructuredComponent
}

export interface DroppedComponentsContextType {
    setAllComponents: (components: StructuredLayout) => void

    handleAddChildToComponent: (
        destination: Destination,
        childComponent: StructuredComponent
    ) => void

    handleRemoveChildFromComponent: (destination: Destination) => void

    handleReorderChildInComponent: (
        draggableId: string,
        source: Destination,
        destination: Destination
    ) => void

    handleUpdateChildComponent: (componentId: string, updates: Partial<StructuredComponent>) => void

    removeRow: (rowId: string) => void
    setEditingComponent: ({ path, component }: EditingComponentParams) => void
    clearEditingComponent: () => void
    currentComponent: EditingComponentParams | null

    components: StructuredLayout

    //types
    types: TypeDef[]
    addType: (type: TypeDef) => void
    updateType: (id: string, updates: Partial<TypeDef>) => void
    removeType: (id: string) => void
    createOrUpdateType: (newType: TypeDef) => void
    getTypeByComponentId: (componentId: string) => TypeDef | undefined
    setAllTypes: (newTypes: TypeDef[]) => void

    //functions
    functions: CustomFunctionConfig[]
    addFunction: (type: CustomFunctionConfig) => void
    updateFunction: (id: string, updates: Partial<CustomFunctionConfig>) => void
    removeFunction: (id: string) => void
    setAllFunctions: (newTypes: CustomFunctionConfig[]) => void

    //states
    states: State[]
    addState: (type: State) => void
    updateState: (id: string, updates: Partial<State>) => void
    removeState: (id: string) => void
    setAllStates: (newTypes: State[]) => void

    //imoports
    imports: Import[]
    addImport: (type: Import) => void
    updateImport: (id: string, updates: Partial<Import>) => void
    removeImport: (id: string) => void
    setAllImports: (newImports: Import[]) => void

    //
    setAllArguments: (args: Arguments[]) => void
    componentArguments: Arguments[]

    //informacoes adicionais
    restData: any
    setAllRestData: (restData: any) => void
}
