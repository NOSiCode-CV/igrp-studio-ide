import { useCallback, useEffect } from 'react';
import { EngineService } from '@renderer/services/EngineService';
import { PageDefinition } from '../page/page-manager';
import { useComponentsContext } from '../contexts/ComponentsContext';

interface ComponentRegistrationProps {
    customComponents: any[];
    fetchComponents: () => any[];
    page: PageDefinition;
}

interface UseComponentRegistrationReturn {
    registerComponents: () => void;
}

export const useComponentRegistration = ({
    customComponents,
    fetchComponents,
    page,
}: ComponentRegistrationProps): UseComponentRegistrationReturn => {

    // Use shared context for components
    const { loadRegistryComponent } = useComponentsContext();

    const registerComponents = useCallback(() => {
        const appComponents = fetchComponents();

        EngineService.registerComponent({
            customComponents,
            appComponents,
            currentPage: page.pageName,
            loadRegistryComponent
        });

    }, [customComponents, page]);

    useEffect(() => {
        // Only register if we have components to register
        registerComponents();

        window.electron.ipcRenderer.on('folder-change', registerComponents);

        return () => {
            window.electron.ipcRenderer.removeListener(
                'folder-change',
                registerComponents
            );
        };
    }, [registerComponents, customComponents]);

    return {
        registerComponents,
    };
}; 