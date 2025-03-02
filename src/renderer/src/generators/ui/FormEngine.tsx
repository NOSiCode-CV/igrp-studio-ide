import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { generateId } from '@renderer/utils/helpers';

import { useConfigdata } from './data/useConfigData';
import {
    Component,
    PageConfig,
} from '@igrp/nextjs-engine/dist/interfaces/types';
import useToast from '@renderer/components/useToast';

import { AppSidebar } from '@renderer/generators/ui/components/sidebar-left';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { buildJsonStructure } from '@renderer/utils/jsonStructureUtil';
import CodeContent from './components/CodeContent';
import { SidebarRight } from './components/sidebar-right';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { DragEndResult, StructuredRow } from '@renderer/lib/dnd/types';
import { handleDragEnd } from './dnd/DraggableItemManager';
import { useDroppedComponents } from './dnd/DroppedComponentsContext';
import { Rows } from './types/components/Rows';

const addRow = () => {
    const newRowId = generateId('row');
    const newRow: StructuredRow = {
        id: newRowId,
        children: [],
    };

    return newRow;
};

interface FormEngineProps {
    basePath: string;
    page: string;
    pagePath: string | undefined;
    isDesign: boolean;
    onSave: () => void;
}

interface FormEngineRef {
    handleSave: () => void;
}

const FormEngine = forwardRef<FormEngineRef, FormEngineProps>(
    ({ basePath, pagePath, page, isDesign }, ref) => {
        const {
            handleAddComponentToRow,
            handleAddChildToComponent,
            reorderComponents,
            moveComponent,
            setInitComponents,
            getAllComponents,
            removeRow,
            getComponent,
            setEditingComponent,
            updateComponent,
            clearEditingComponent,
            currentComponent,
        } = useDroppedComponents();

        const components = getAllComponents();

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
            if (components.length === 0) {
                const newRow = addRow();
                setInitComponents([newRow]);
            }
        }, [components]);

        useEffect(() => {
            clearEditingComponent();
        }, [isDesign]);

        const handleSave = async (jsonStructure: Component[]) => {
            try {
                if (basePath === undefined) return;

                const pageConfig: PageConfig = {
                    type: 'page',
                    pageName: page,
                    path: page,
                };

                const { error } = await window.api.addComponentToPage(
                    pageConfig,
                    jsonStructure,
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
                        /*let dataSaved: HierarchicalComponent[] = [];

                          data.components.map((row) => {
                            dataSaved = [
                                ...dataSaved,
                                {
                                    id: generateId('row'),
                                    columns: row.Row.map((col) => ({
                                        id: col.id || generateId('col'),
                                        colSize: 12,
                                        components: col.Col.flatMap((c) =>
                                            c.components.map((comp) => ({
                                                ...comp,
                                            }))
                                        ),
                                    })),
                                },
                            ];
                        }); */

                        setInitComponents(data.components);
                    }
                } catch (error) {
                    console.error('Failed to load JSON content:', error);
                }
            };
            getJsonData();
        }, [basePath, page]);

        const droppedComponentsMethods = {
            reorderComponents,
            getComponent,
            setEditingComponent,
            setInitComponents,
            removeRow,
            moveComponent,
            updateComponent,
            handleAddComponentToRow,
            handleAddChildToComponent,
        };

        const onDragEnd = useCallback((result: DragEndResult) => {
            console.log('dropZone', result);
            const component = undefined; //getComponent(draggableId);
            handleDragEnd(
                result,
                component === undefined,
                droppedComponentsMethods
            );
        }, []);

        return (
            <>
                <AppSidebar data={menuItems} basePath={basePath} />
                <SidebarInset>
                    {isDesign ? (
                        <ScrollArea className="h-[calc(100svh-var(--header-height-two))] !bg-custom-pattern">
                            <div className="px-4 py-6 gap-3 grid">
                                <Rows
                                    components={components}
                                    onDragEnd={onDragEnd}
                                />
                            </div>
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
