import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';

import { useConfigdata } from './utils/useConfigData';
import {
    ComponentConfig,
    PageConfig,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import useToast from '@renderer/components/useToast';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';

import { AppSidebar } from '@renderer/generators/ui/components/sidebar-left';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { buildJsonStructure } from '@renderer/utils/jsonStructureUtil';
import CodeContent from './components/CodeContent';
import { SidebarRight } from './components/sidebar-right';
import { DragEndResult, StructuredLayout } from '@renderer/lib/dnd/types';
import { handleDragEnd } from './dnd/DraggableItemManager';
import { useDroppedComponents } from './dnd/DroppedComponentsContext';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { useDispatch } from 'react-redux';
import { ContainerScrollArea } from '../api/components/ContainerScrollArea';
import { Page } from './types/components/Page';

interface FormEngineProps {
    basePath: string;
    page: any;
    isDesign: boolean;
    onSave: () => void;
}

interface FormEngineRef {
    handleSave: () => void;
}

const FormEngine = forwardRef<FormEngineRef, FormEngineProps>(
    ({ basePath, page, isDesign }, ref) => {
        const { id, content, path: pagePath, label } = page;
        const { type, path } = content;

        const {
            handleAddChildToComponent,
            handleReorderChildInComponent,
            getAllComponents,
            removeRow,
            setEditingComponent,
            clearEditingComponent,
            currentComponent,
            setInitComponents,
        } = useDroppedComponents();

        const components: StructuredLayout = getAllComponents();

        const { showErrorToast, showSuccessToast } = useToast();

        const { menuItems } = useConfigdata();

        const dispatch: any = useDispatch();

        // Internal handleSave function in FormEngine
        const internalHandleSave = () => {
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
                    id,
                    type,
                    path,
                    pageName: label,
                    components: jsonStructure,
                };

                const compConfig: ComponentConfig = {
                    id,
                    type,
                    path,
                    name: label,
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

                dispatch(onSetChangeStatus(true));
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
            handleAddChildToComponent,
            handleReorderChildInComponent,
        };

        const onDragEnd = useCallback((result: DragEndResult) => {
            console.log('dropZone', result);
            handleDragEnd(result, droppedComponentsMethods);
        }, []);

        return (
            <div className="flex flex-1 overflow-hidden">
                <AppSidebar data={menuItems} basePath={basePath}/>
                <SidebarInset>
                    <ContainerScrollArea>
                        {isDesign ? (
                            <Page page={components} onDragEnd={onDragEnd} />
                        ) : (
                            <CodeContent pagePath={pagePath} />  
                        )}
                    </ContainerScrollArea>
                </SidebarInset>
                {currentComponent && <SidebarRight />}
            </div>
        );
    }
);
export default FormEngine;
