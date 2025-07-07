import { useCallback, useEffect, useState } from 'react';

interface JsonDataLoadingProps {
    pagePath: string | undefined;
    page: any;
    setAllArguments: (args: any) => void;
    setAllComponents: (components: any) => void;
    setAllTypes: (types: any) => void;
    setAllFunctions: (functions: any) => void;
    setAllStates: (states: any) => void;
    setAllImports: (imports: any) => void;
    setLoading: (loading: boolean) => void;
}

interface UseJsonDataLoadingReturn {
    isLoading: boolean;
    loadJsonData: () => Promise<void>;
}

export const useJsonDataLoading = ({
    pagePath,
    page,
    setAllArguments,
    setAllComponents,
    setAllTypes,
    setAllFunctions,
    setAllStates,
    setAllImports,
    setLoading,
}: JsonDataLoadingProps): UseJsonDataLoadingReturn => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const loadJsonData = useCallback(async () => {
        try {
            if (pagePath === undefined) return;

            setIsLoading(true);

            const data = await window.api.getJsonContent(pagePath);

            setAllArguments(data.args);

            if (data.components) {
                setLoading(true);
                setAllComponents(data.components);
                setAllTypes(data.types);
                setAllFunctions(data.functions);
                setAllStates(data.states);
                setAllImports(data.imports);
            }
        } catch (error) {
            console.error('Failed to load JSON content:', error);
        } finally {
            setIsLoading(false);
        }
    }, [pagePath, setAllArguments, setAllComponents, setAllTypes, setAllFunctions, setAllStates, setAllImports, setLoading]);

    useEffect(() => {
        loadJsonData();
    }, [pagePath, page, loadJsonData]);

    return {
        isLoading,
        loadJsonData,
    };
}; 