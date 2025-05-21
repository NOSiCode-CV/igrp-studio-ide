import { State, CustomFunctionConfig, CodeSnippetsRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { useDroppedComponents } from "@renderer/generators/ui/dnd/DroppedComponentsContext";
import useStudio from "@renderer/hooks/use-studio";
import { StructuredComponent } from "@renderer/lib/dnd/types";
import { EngineService } from "@renderer/services/EngineService";
import { useMemo, useState, useEffect } from "react";
import { useComponents } from "./useComponents";

interface Option {
    label: string;
    value: string;
    metadata?: any
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
    const { extractAllStates } = useComponents()
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
                    extractAllStates()
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

        /*   window.electron.ipcRenderer.on('folder-change', fetchData);
  
          return () => {
              window.electron.ipcRenderer.removeListener(
                  'folder-change',
                  fetchData
              );
          }; */
    }, [basePath]);

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