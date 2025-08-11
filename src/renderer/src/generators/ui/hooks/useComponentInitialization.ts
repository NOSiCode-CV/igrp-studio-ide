import { useCallback } from 'react';
import { COMPONENT } from '../ComponentTypes';
import { newStructuredComponent } from '../dnd/helpers';
import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';

interface ComponentInitializationProps {
    content: any;
    menuItems: any[];
    findComponentById: (componentName: string) => Promise<ComponentRegisterConfig | undefined>;
    generateTag: (base: string) => string;
    setAllComponents: (components: any) => void;
    findComponent: (path: string | undefined, componentName: string) => Promise<ComponentRegisterConfig | undefined>;
}

interface UseComponentInitializationReturn {
    initializeComponents: () => Promise<void>;
}

export const useComponentInitialization = ({
    content,
    findComponentById,
    generateTag,
    setAllComponents,
    findComponent
}: ComponentInitializationProps): UseComponentInitializationReturn => {

    const initializeComponents = useCallback(async () => {
        try {
            const isPage = content.type === 'page';
            const isBpmnProcess = content.type === 'processStep'

            let steps: any[] = [];

            const mainComponent = isPage
                ? COMPONENT.PageContent
                : isBpmnProcess
                    ? COMPONENT.ProcessStep
                    : COMPONENT.ComponentContent;

            let pageCompRegister

            if (isBpmnProcess) {
                pageCompRegister = await findComponent('process', COMPONENT.ProcessStep);
            } else {
                pageCompRegister = await findComponentById(mainComponent);
            }
            const sectionCompRegister = await findComponentById(COMPONENT.Section);

            if (!pageCompRegister && !isBpmnProcess) {
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
                    ? [{ ...section, tag: generateTag(COMPONENT.Section) },]
                    : steps,
                pageCompRegister
            );

            setAllComponents({
                ...pageContent,
                tag: generateTag(mainComponent),
            });

        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }, []);

    return {
        initializeComponents,
    };
}; 