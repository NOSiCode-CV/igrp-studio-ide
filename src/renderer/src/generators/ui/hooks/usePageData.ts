import { useState, useCallback, useEffect } from 'react';
import { PageDefinition } from '../page/page-manager';

interface PageDataSetters {
    setAllArguments: (args: any[]) => void;
    setAllComponents: (components: any) => void;
    setAllTypes: (types: any[]) => void;
    setAllFunctions: (functions: any[]) => void;
    setAllStates: (states: any[]) => void;
    setAllImports: (imports: any[]) => void;
}

interface UsePageDataReturn {
    isLoading: boolean;
    loadPageData: () => Promise<void>;
}

export const usePageData = (
    pagePath: string | undefined,
    _page: PageDefinition,
    setters: PageDataSetters
): UsePageDataReturn => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const loadPageData = useCallback(async () => {
        try {
            if (!pagePath) {
                console.log('[Debug] usePageData: No pagePath provided');
                return;
            }

            console.log('[Debug] usePageData: Loading data for', pagePath);
            setIsLoading(true);

            const data = await window.api.getJsonContent(pagePath);
            console.log('[Debug] usePageData: Data loaded', data);

            setters.setAllArguments(data.args || []);

            if (data.components) {
                setters.setAllComponents(data.components);
                setters.setAllTypes(data.types || []);
                setters.setAllFunctions(data.functions || []);
                setters.setAllStates(data.states || []);
                setters.setAllImports(data.imports || []);
            }
        } catch (error) {
            console.error('Failed to load JSON content:', error);
        } finally {
            setIsLoading(false);
            console.log('[Debug] usePageData: Loading completed');
        }
    }, [pagePath, setters]);

    useEffect(() => {
        console.log('[Debug] usePageData: useEffect triggered', { pagePath });
        
        if (pagePath) {
            loadPageData();
        }
    }, [pagePath, loadPageData]);

    return {
        isLoading,
        loadPageData,
    };
}; 