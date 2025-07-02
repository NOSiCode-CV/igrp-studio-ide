import { State, CustomFunctionConfig, CodeSnippetsRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { useDroppedComponents } from "@renderer/generators/ui/dnd/DroppedComponentsContext";
import useStudio from "@renderer/hooks/use-studio";
import { EngineService } from "@renderer/services/EngineService";
import { useMemo, useState, useEffect } from "react";
import { useComponents } from "./useComponents";

export interface Option {
    label: string;
    value: string;
    metadata?: any
}

const defaultTypes = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'object', label: 'Object' },
    { value: 'array', label: 'Array' },
    { value: 'void', label: 'Void' },
    { value: 'any', label: 'Any' },
];

interface CustomCodeHook {
    functions: CustomFunctionConfig[];
    states: State[];
    functionOptions: Option[];
    typesOptions: Option[];
    statesOptions: Option[]
    snippets: CodeSnippetsRegisterConfig[];
    types: any[];
    customComponents: any[];
    isLoading: boolean;
    error: Error | null;
}

const useCustomCode = (): CustomCodeHook => {
    const { states: drpoppedStates, functions: droppedFunctions } = useDroppedComponents();
    const { extractAllStates } = useComponents()
    const [metadataFunctions, setMetadataFunctions] = useState<CustomFunctionConfig[]>([]);
    const [metadataStates, setMetadataStates] = useState<State[]>([]);
    const [customComponents, setCustomComponents] = useState<[]>([]);

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
        const dynamicTypeOptions = types.map((type) => ({
            label: type.name,
            value: type.name,
            metadata: type
        }));

        return [...defaultTypes, ...dynamicTypeOptions];
    }, [types]);

    const statesOptions = useMemo<Option[]>(() => {
        return states.map((type) => ({
            label: type.name,
            value: type.name,
        }));
    }, [states]);

    // Fetch code snippets and metadata
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Parallel fetching
                const [snippetsResponse, metadataResponse, metadataStates] = await Promise.all([
                    EngineService.getCodeSnippets(),
                    EngineService.getAppMetadata(basePath),
                    extractAllStates()
                ]);

                const { result } = metadataResponse

                setMetadataStates(metadataStates || []);

                setSnippets(snippetsResponse.result?.codes || []);
                console.log('result', result);
                if (result) {
                    setMetadataFunctions([...(result.functions || []), ...(result.actions || [])]);
                    setTypes(result.types || [])
                    setCustomComponents(result.components || [])
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to load resources'));
                console.error('Error loading data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();

        window.electron.ipcRenderer.on('folder-change', fetchData);

        return () => {
            window.electron.ipcRenderer.removeListener(
                'folder-change',
                fetchData
            );
        };
    }, [basePath]);

    return {
        functions,
        states,
        functionOptions,
        typesOptions,
        statesOptions,
        snippets,
        types,
        customComponents,
        isLoading,
        error,
    };
};

export default useCustomCode;