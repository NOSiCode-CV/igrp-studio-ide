import { State } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { StructuredComponent } from "@renderer/lib/dnd/types";
import { useDroppedComponents } from "../dnd/DroppedComponentsContext";
import { useCallback } from "react";
import { COMPONENT } from "../ComponentTypes";



export const useComponents = () => {

    const { components } = useDroppedComponents();

    const extractAllStates = useCallback((): State[] => {
        const states: State[] = [];

        function traverse(currentNode: StructuredComponent) {
            if (!currentNode.data) return;

            // Verifica todas as chaves do objeto `data`
            Object.entries(currentNode.data).forEach(([key, value]) => {
                // Caso 1: Estado direto (data.state)
                if (key === 'state' && isState(value)) {
                    states.push(validateState(value));
                }
                // Caso 2: Objeto aninhado que pode conter state
                else if (value && typeof value === 'object') {
                    if ('state' in value && isState(value.state)) {
                        states.push(validateState(value.state));
                    }
                }
            });

            // Recursão para filhos
            if (currentNode.children?.length) {
                currentNode.children.forEach(child => traverse(child));
            }
        }

        // Valida se um objeto é um State válido
        function isState(obj: any): obj is Partial<State> {
            return obj && typeof obj === 'object' && 'name' in obj && 'type' in obj;
        }

        // Garante que o state tenha todas propriedades necessárias
        function validateState(state: Partial<State>): State {
            return {
                id: state.id || '',
                type: state.type || 'any',
                name: state.name || 'unnamed',
                defaultValue: state.defaultValue,
                imports: state.imports || [],
                ...state // Mantém outras propriedades
            };
        }

        traverse(components);
        return states;
    }, [])
    const extractAllComponents = useCallback((componentName: string): Map<string, StructuredComponent> => {
        const componentMap = new Map<string, StructuredComponent>();

        const processComponent = (child: StructuredComponent) => {
            if (!child) return;

            if (child.componentName === componentName) {
                componentMap.set(child.tag, child);
            }

            if (Array.isArray(child.children)) {
                child.children.forEach(processComponent);
            }
        };

        if (components?.children) {
            components.children.forEach(processComponent);
        }

        return componentMap;
    }, [components]);

    /**
     * Get formatted form options for combobox/dropdown
     * Filters components with type 'form' and returns {value, label} pairs
     */
    const getFormOptions = useCallback((): Array<{ value: string; label: string }> => {
        // Get all form components using the existing extractAllComponents
        const formComponents = extractAllComponents(COMPONENT.Form);

        // Convert to combobox options format
        const options: Array<{ value: string; label: string }> = [];

        formComponents.forEach((component, id) => {
            options.push({
                value: id, // or component.id if you prefer
                label: component.properties?.label ||
                    component.tag ||
                    `Form ${component.id.slice(0, 4)}`
            });
        });

        return options;
    }, [extractAllComponents]);

    return {
        extractAllStates,
        extractAllComponents,
        getFormOptions
    };
}