import { State, CustomFunctionConfig, CodeSnippetsRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { useDroppedComponents } from "@renderer/generators/ui/dnd/DroppedComponentsContext";
import useStudio from "@renderer/hooks/use-studio";
import { StructuredComponent } from "@renderer/lib/dnd/types";
import { EngineService } from "@renderer/services/EngineService";
import { useMemo, useState, useEffect } from "react";

interface Option {
    label: string;
    value: string;
}

interface CustomCodeHook {
    functions: CustomFunctionConfig[];
    states: State[];
    functionOptions: Option[];
    typesOptions: Option[];
    snippets: CodeSnippetsRegisterConfig[];
    types: any[];
    isLoading: boolean;
    error: Error | null;
}

const useCustomCode = (): CustomCodeHook => {
    const { states: drpoppedStates, functions: droppedFunctions, components } = useDroppedComponents();
    const [metadataFunctions, setMetadataFunctions] = useState<CustomFunctionConfig[]>([]);
    const [metadataStates, setMetadataStates] = useState<State[]>([]);

    const [snippets, setSnippets] = useState<CodeSnippetsRegisterConfig[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const { basePath } = useStudio();

    // Merge dropped functions with metadata functions
    const functions = useMemo(() => {
        return [...droppedFunctions, ...metadataFunctions];
    }, [droppedFunctions, metadataFunctions]);

    // Merge dropped functions with metadata functions
    const states = useMemo(() => {
        return [...drpoppedStates, ...metadataStates];
    }, [drpoppedStates, metadataStates]);

    // Memoize function options
    const functionOptions = useMemo<Option[]>(() => {
        return functions.map((fn) => ({
            label: fn.name,
            value: fn.name,
            metadata: fn
        }));
    }, [functions]);

    const typesOptions = useMemo<Option[]>(() => {
        return types.map((type) => ({
            label: type.name,
            value: type.name,
        }));
    }, [types]);

    // Fetch code snippets and metadata
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Parallel fetching
                const [snippetsResponse, metadataResponse, metadataStates] = await Promise.all([
                    EngineService.getCodeSnippets(),
                    EngineService.getAppMetadata(basePath),
                    extractAllStates(components)
                ]);

                setMetadataStates(metadataStates || []);

                setSnippets(snippetsResponse.result?.codes || []);

                setMetadataFunctions(metadataResponse.result.functions || []);

                setTypes(metadataResponse.result.types || [])
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to load resources'));
                console.error('Error loading data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [basePath]);

    /*  useEffect(() => {
    window.electron.ipcRenderer.on('folder-change', loadMetadata);

    return () => {
        window.electron.ipcRenderer.removeListener(
            'message-update',
            loadMetadata
        );
    };
}, []);*/
    return {
        functions,
        states,
        functionOptions,
        typesOptions,
        snippets,
        types,
        isLoading,
        error,
    };
};

export function extractAllStates(node: StructuredComponent): State[] {
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

    traverse(node);
    return states;
}

export default useCustomCode;