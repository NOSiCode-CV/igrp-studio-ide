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
}

interface UseComponentInitializationReturn {
    initializeComponents: () => Promise<void>;
}

export const useComponentInitialization = ({
    content,
    findComponentById,
    generateTag,
    setAllComponents,
}: ComponentInitializationProps): UseComponentInitializationReturn => {

    const initializeComponents = useCallback(async () => {
        try {
            const isPage = content.type === 'page';
            const isBpmnProcess = content.type === 'bpmn-process'

            let steps: any[] = [];

            const mainComponent = isPage
                ? COMPONENT.PageContent
                : isBpmnProcess
                    ? COMPONENT.ProcessContent
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
            
            if (isBpmnProcess) {
                // Add BPMN artifacts to the page content

                try {
                    const artifacts = content.artifacts || [];

                    artifacts.forEach(async (artifact: any) => {
                        const processStepCompRegister = await findComponentById(COMPONENT.ProcessStep);

                        const processStep = newStructuredComponent(
                            COMPONENT.ProcessStep,
                            [],
                            processStepCompRegister
                        );

                        processStep.properties = {
                            ...processStep.properties,
                            ...artifact
                        };

                        steps.push(processStep);
                    })

                } catch (error) {
                    console.error('Error processing BPMN artifacts:', error);
                }
            }

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