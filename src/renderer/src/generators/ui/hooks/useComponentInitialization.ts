import { useCallback } from 'react';
import { COMPONENT } from '../ComponentTypes';
import { newStructuredComponent } from '../dnd/helpers';

interface ComponentInitializationProps {
    isPage: boolean;
    menuItems: any[];
    findComponentById: (id: string) => Promise<any>;
    generateTag: (base: string) => string;
    setAllComponents: (components: any) => void;
}

interface UseComponentInitializationReturn {
    initializeComponents: () => Promise<void>;
}

export const useComponentInitialization = ({
    isPage,
    menuItems,
    findComponentById,
    generateTag,
    setAllComponents,
}: ComponentInitializationProps): UseComponentInitializationReturn => {
    const initializeComponents = useCallback(async () => {
        console.log('[Debug] useComponentInitialization: Starting initialization', {
            menuItemsLength: menuItems.length,
            isPage
        });

        if (!menuItems.length) {
            console.log('[Debug] useComponentInitialization: No menu items, skipping');
            return;
        }

        try {
            const mainComponent = isPage
                ? COMPONENT.PageContent
                : COMPONENT.ComponentContent;

            console.log('[Debug] useComponentInitialization: Finding components', { mainComponent });

            const pageCompRegister = await findComponentById(mainComponent);
            const sectionCompRegister = await findComponentById(COMPONENT.Section);

            if (!pageCompRegister) {
                console.warn(`Component ${mainComponent} not found`);
                return;
            }

            console.log('[Debug] useComponentInitialization: Creating structured components');

            const section = newStructuredComponent(
                COMPONENT.Section,
                [],
                sectionCompRegister
            );

            const pageContent = newStructuredComponent(
                mainComponent,
                isPage
                    ? [{ ...section, tag: generateTag(COMPONENT.Section) }]
                    : [],
                pageCompRegister
            );

            setAllComponents({
                ...pageContent,
                tag: generateTag(mainComponent),
            });

            console.log('[Debug] useComponentInitialization: Components initialized successfully');
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }, [isPage, menuItems, findComponentById, generateTag, setAllComponents]);

    return {
        initializeComponents,
    };
}; 