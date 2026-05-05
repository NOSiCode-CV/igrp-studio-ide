import type { Arguments, FieldValidation, State } from '@igrp/igrp-studio-nextjs-engine/types'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { useCallback } from 'react'
import { COMPONENT } from '../ComponentTypes'
import { useDroppedComponents } from '../contexts/EditorContext'

interface LabeledElementField {
    componentId: string
    name: string
    type: string
    validation?: FieldValidation
    defaultValue?: string
    required: boolean
    label: string
    fields?: LabeledElementField[]
    isList?: boolean
}

const defaultFieldType: LabeledElementField = {
    componentId: '',
    name: '',
    type: 'string',
    required: false,
    defaultValue: undefined,
    label: '',
    isList: false
}

export const useComponents = (): {
    extractValidFields: (components: StructuredComponent[]) => {
        fields: LabeledElementField[]
        componentMap: Map<string, StructuredComponent>
    }
    extractAllStates: () => State[]
    extractAllComponentsWithRefs: () => Map<string, StructuredComponent>
    extractAllComponents: (componentName: string) => Map<string, StructuredComponent>
    extractComponentsFromPage: (
        rootComponent: StructuredComponent,
        componentName: string
    ) => Map<string, StructuredComponent>
    getFormOptions: () => Array<{ value: string; label: string }>
    getRefsOptions: () => Array<{ value: string; label: string }>
    componentArguments: Arguments[]
    getArqumentsOptions: () => Array<{ value: string; label: string }>
} => {
    const { components, componentArguments } = useDroppedComponents()

    const extractAllStates = useCallback((): State[] => {
        const states: State[] = []

        function traverse(currentNode: StructuredComponent): void {
            // Verifica todas as chaves do objeto `data`
            Object.entries(currentNode?.data || []).forEach(([key, value]) => {
                // Caso 1: Estado direto (data.state)
                if (key === 'state' && isState(value)) {
                    states.push(validateState(value, currentNode.tag))
                }
                // Caso 2: Objeto aninhado que pode conter state
                else if (value && typeof value === 'object') {
                    if ('state' in value && isState(value.state)) {
                        states.push(validateState(value.state, currentNode.tag))
                    }
                }
            })

            // Recursão para filhos
            if (currentNode.children?.length) {
                currentNode.children.forEach((child) => traverse(child))
            }
        }

        // Valida se um objeto é um State válido
        function isState(obj: any): obj is Partial<State> {
            return obj && typeof obj === 'object' && 'name' in obj && 'type' in obj
        }

        // Garante que o state tenha todas propriedades necessárias
        function validateState(state: Partial<State>, tag: string): State {
            return {
                ...state, // Mantém outras propriedades
                id: state.id || '',
                type: state.type?.replace('{{id}}', tag) || 'any',
                name: state.name?.replace('{{id}}', tag) || '',
                defaultValue: state.defaultValue,
                imports: state.imports || []
            }
        }

        traverse(components)
        return states
    }, [components])

    const extractAllComponents = useCallback(
        (componentName: string): Map<string, StructuredComponent> => {
            const componentMap = new Map<string, StructuredComponent>()

            const processComponent = (child: StructuredComponent): void => {
                if (!child) return

                if (child.componentName === componentName) {
                    componentMap.set(child.tag, child)
                }

                if (Array.isArray(child.children)) {
                    child.children.forEach(processComponent)
                }
            }

            if (components?.children) {
                components.children.forEach(processComponent)
            }

            return componentMap
        },
        [components]
    )

    const extractComponentsFromPage = useCallback(
        (
            rootComponent: StructuredComponent,
            componentName: string
        ): Map<string, StructuredComponent> => {
            const componentMap = new Map<string, StructuredComponent>()

            const processComponent = (child: StructuredComponent): void => {
                if (!child) return

                if (child.componentName === componentName) {
                    componentMap.set(child.tag, child)
                }

                if (Array.isArray(child.children)) {
                    child.children.forEach(processComponent)
                }
            }

            if (rootComponent?.children) {
                rootComponent.children.forEach(processComponent)
            }

            return componentMap
        },
        []
    )

    const extractAllComponentsWithRefs = useCallback((): Map<string, StructuredComponent> => {
        const componentMap = new Map<string, StructuredComponent>()

        const processComponent = (child: StructuredComponent): void => {
            if (!child) return

            if (child.properties?.commonProperties?.generateReference) {
                componentMap.set(child.tag, child)
            }

            if (Array.isArray(child.children)) {
                child.children.forEach(processComponent)
            }
        }

        if (components?.children) {
            components.children.forEach(processComponent)
        }

        return componentMap
    }, [components])

    /**
     * Get formatted form options for combobox/dropdown
     * Filters components with type 'form' and returns {value, label} pairs
     */
    const getFormOptions = useCallback((): Array<{
        value: string
        label: string
    }> => {
        // Get all form components using the existing extractAllComponents
        const formComponents = extractAllComponents(COMPONENT.Form)

        // Convert to combobox options format
        const options: Array<{ value: string; label: string }> = []

        formComponents.forEach((component, id) => {
            options.push({
                value: id, // or component.id if you prefer
                label:
                    component.properties?.label ||
                    component.tag ||
                    `Form ${component.id.slice(0, 4)}`
            })
        })

        return options
    }, [extractAllComponents])

    const extractValidFields = useCallback(
        (
            components: StructuredComponent[]
        ): {
            fields: LabeledElementField[]
            componentMap: Map<string, StructuredComponent>
        } => {
            const componentMap: Map<string, StructuredComponent> = new Map()
            const fields: LabeledElementField[] = []

            const processComponent = (
                child: StructuredComponent,
                parentIsRepeater = false
            ): void => {
                if (!child) return

                // Check if component should be included as a field
                const shouldInclude =
                    child?.properties?.dataProperties &&
                    !child.properties.dataProperties.isVirtual &&
                    child.properties.dataProperties.isType

                const isDynamicRepeater = child.componentName === COMPONENT.FormList

                if (isDynamicRepeater) {
                    // Process children first to get the nested fields structure
                    const nestedFields: LabeledElementField[] = []
                    const nestedComponentMap: Map<string, StructuredComponent> = new Map()

                    // Temporary process to get nested structure
                    const tempProcess = (nestedChild: StructuredComponent): void => {
                        if (!nestedChild) return

                        const nestedShouldInclude =
                            nestedChild?.properties?.dataProperties &&
                            !nestedChild.properties.dataProperties.isVirtual &&
                            nestedChild.properties.dataProperties.isType

                        if (nestedShouldInclude) {
                            nestedFields.push({
                                ...defaultFieldType,
                                name: nestedChild.tag,
                                componentId: nestedChild.id,
                                label: nestedChild.properties.label ?? nestedChild.label
                            })
                            nestedComponentMap.set(nestedChild.id, nestedChild)
                        }

                        if (Array.isArray(nestedChild.children)) {
                            nestedChild.children.forEach(tempProcess)
                        }
                    }

                    child.children.forEach(tempProcess)

                    // Only add the repeater field if it hasn't been added yet
                    fields.push({
                        ...defaultFieldType,
                        name: child.tag,
                        componentId: child.id,
                        label:
                            child.properties.label ?? child.properties.headerTitle ?? child.label,
                        isList: true,
                        type: 'object',
                        // Add nested fields structure as options
                        fields: nestedFields.map((field) => ({
                            ...defaultFieldType,
                            ...field
                        }))
                    })

                    // Add all components to the main map
                    componentMap.set(child.id, child)
                    nestedComponentMap.forEach((value, key) => componentMap.set(key, value))

                    return // Skip further processing for repeater children
                }

                if (shouldInclude && !parentIsRepeater) {
                    fields.push({
                        ...defaultFieldType,
                        name: child.tag,
                        componentId: child.id,
                        label:
                            child.properties.label ?? child.properties.headerTitle ?? child.label,
                        // Include type if available
                        type: child.properties.dataProperties?.type || undefined
                    })

                    componentMap.set(child.id, child)
                }

                // Process children recursively (unless parent is a repeater)
                if (Array.isArray(child.children) && !parentIsRepeater) {
                    child.children.forEach((c) => processComponent(c, isDynamicRepeater))
                }
            }

            components.forEach((component) => processComponent(component))

            return { fields, componentMap }
        },
        [components]
    )

    /**
     * Get formatted ref options for combobox/dropdown
     * Filters components with type 'form' and returns {value, label} pairs
     */
    const getRefsOptions = useCallback((): Array<{
        value: string
        label: string
    }> => {
        const refsComponents = extractAllComponentsWithRefs()

        // Convert to combobox options format
        const options: Array<{ value: string; label: string }> = []

        refsComponents.forEach((component) => {
            options.push({
                value: component.tag, // or component.id if you prefer
                label:
                    component.properties?.label ||
                    component.tag ||
                    `Component ${component.id.slice(0, 4)}`
            })
        })

        return options
    }, [extractAllComponentsWithRefs])

    const getArqumentsOptions = useCallback((): Array<{
        value: string
        label: string
    }> => {
        return componentArguments.map((arg) => ({
            value: arg.name,
            label: arg.name
        }))
    }, [componentArguments])

    return {
        extractValidFields,
        extractAllStates,
        extractAllComponentsWithRefs,
        extractAllComponents,
        extractComponentsFromPage,
        getFormOptions,
        getRefsOptions,
        componentArguments,
        getArqumentsOptions
    }
}
