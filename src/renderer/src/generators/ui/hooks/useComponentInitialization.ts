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

        if (!menuItems.length) {
            console.log('[Debug] useComponentInitialization: No menu items, skipping');
            return;
        }

        try {
            const mainComponent = isPage
                ? COMPONENT.PageContent
                : COMPONENT.ComponentContent;

            const pageCompRegister = await findComponentById(mainComponent);
            const sectionCompRegister = await findComponentById(COMPONENT.Section);

            if (!pageCompRegister) {
                console.warn(`Component ${mainComponent} not found`);
                return;
            }

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

        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }, [isPage, menuItems]);

    return {
        initializeComponents,
    };
}; 