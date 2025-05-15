import { State, CustomFunctionConfig, CodeSnippetsRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { useDroppedComponents } from "@renderer/generators/ui/dnd/DroppedComponentsContext";
import useStudio from "@renderer/hooks/use-studio";
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
    const { states, functions: droppedFunctions } = useDroppedComponents();
    const [metadataFunctions, setMetadataFunctions] = useState<CustomFunctionConfig[]>([]);
    const [snippets, setSnippets] = useState<CodeSnippetsRegisterConfig[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const { basePath } = useStudio();

    // Merge dropped functions with metadata functions
    const functions = useMemo(() => {
        return [...droppedFunctions, ...metadataFunctions];
    }, [droppedFunctions, metadataFunctions]);

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
                const [snippetsResponse, metadataResponse] = await Promise.all([
                    EngineService.getCodeSnippets(),
                    EngineService.getAppMetadata(basePath)
                ]);

                setSnippets(snippetsResponse.result?.codes || []);

                // Extract functions from metadata
                const metadata = metadataResponse.result;

                setMetadataFunctions(metadata.functions || []);

                setTypes(metadata.types || [])

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

export default useCustomCode;