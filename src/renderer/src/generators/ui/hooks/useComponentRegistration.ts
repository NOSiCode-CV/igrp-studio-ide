import { useCallback, useEffect } from 'react';
import { EngineService } from '@renderer/services/EngineService';
import { PageDefinition } from '../page/page-manager';

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
    const registerComponents = useCallback(() => {
        const appComponents = fetchComponents();

        EngineService.registerComponent({
            customComponents,
            appComponents,
            currentPage: page.pageName,
        });

    }, [customComponents, fetchComponents, page.pageName]);

    useEffect(() => {
        // Only register if we have components to register
        if (customComponents.length > 0) {
            registerComponents();
        }

        window.electron.ipcRenderer.on('folder-change', registerComponents);

        return () => {
            window.electron.ipcRenderer.removeListener(
                'folder-change',
                registerComponents
            );
        };
    }, [registerComponents, customComponents.length]);

    return {
        registerComponents,
    };
}; 