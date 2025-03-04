import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';

import { useConfigdata } from './data/useConfigData';
import {
    ComponentConfig,
    PageConfig,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import useToast from '@renderer/components/useToast';

import { AppSidebar } from '@renderer/generators/ui/components/sidebar-left';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { buildJsonStructure } from '@renderer/utils/jsonStructureUtil';
import CodeContent from './components/CodeContent';
import { SidebarRight } from './components/sidebar-right';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { DragEndResult, StructuredLayout } from '@renderer/lib/dnd/types';
import { handleDragEnd } from './dnd/DraggableItemManager';
import { useDroppedComponents } from './dnd/DroppedComponentsContext';
import { Page } from './types/components/Page';
import { ENV_TYPES } from '@renderer/constants/appConstants';

interface FormEngineProps {
    basePath: string;
    page: string;
    type?: string;
    pagePath: string | undefined;
    isDesign: boolean;
    onSave: () => void;
}

interface FormEngineRef {
    handleSave: () => void;
}

const FormEngine = forwardRef<FormEngineRef, FormEngineProps>(
    ({ basePath, pagePath, page, isDesign, type = 'page' }, ref) => {
        const {
            handleAddChildToComponent,
            handleReorderChildInComponent,
            getAllComponents,
            removeRow,
            setEditingComponent,
            updateComponent,
            clearEditingComponent,
            currentComponent,
            setInitComponents,
        } = useDroppedComponents();

        const components: StructuredLayout = getAllComponents();

        const { showErrorToast, showSuccessToast } = useToast();

        const { menuItems } = useConfigdata();

        // Internal handleSave function in FormEngine
        const internalHandleSave = () => {
            console.log('FormEngine save triggered');
            const jsonStructure = buildJsonStructure(components);
            handleSave(jsonStructure);
        };

        // Expose handleSave to parent via ref
        useImperativeHandle(ref, () => ({
            handleSave: internalHandleSave,
        }));

        useEffect(() => {
            clearEditingComponent();
        }, [isDesign]);

        const handleSave = async (jsonStructure: StructuredLayout) => {
            try {
                if (basePath === undefined) return;

                const pageConfig: PageConfig = {
                    type: 'page',
                    pageName: page,
                    path: page,
                    components: jsonStructure,
                };

                const compConfig: ComponentConfig = {
                    type: 'component',
                    name: page,
                    path: page,
                    components: jsonStructure,
                };

                const { error } = await window.engine.createPage(
                    type === 'page' ? pageConfig : compConfig,
                    ENV_TYPES.NEXTJS,
                    basePath
                );

                if (error) {
                    showErrorToast(error);
                    return;
                }

                showSuccessToast('Components added successfully');
            } catch (error) {
                showErrorToast(error);
            }
        };

        //TODO for refactor after accert new json model
        useEffect(() => {
            const getJsonData = async () => {
                try {
                    if (pagePath === undefined) return;

                    const data = await window.api.getJsonContent(pagePath);
                    if (data.components) {
                        setInitComponents(data.components);
                    }
                } catch (error) {
                    console.error('Failed to load JSON content:', error);
                }
            };
            getJsonData();
        }, [basePath, page]);

        const droppedComponentsMethods = {
            setEditingComponent,
            removeRow,
            updateComponent,
            handleAddChildToComponent,
            handleReorderChildInComponent,
        };

        const onDragEnd = useCallback((result: DragEndResult) => {
            console.log('dropZone', result);
            handleDragEnd(result, droppedComponentsMethods);
        }, []);

        return (
            <>
                <AppSidebar data={menuItems} basePath={basePath} />
                <SidebarInset>
                    {isDesign ? (
                        <ScrollArea>
                            <Page page={components} onDragEnd={onDragEnd} />
                        </ScrollArea>
                    ) : (
                        <CodeContent pagePath={pagePath} />
                    )}
                </SidebarInset>
                {currentComponent && <SidebarRight />}
            </>
        );
    }
);
export default FormEngine;
