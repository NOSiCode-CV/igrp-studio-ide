import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import RowContainer from "./types/containers/rows";
import { useDroppedComponents } from "./dnd/DroppedComponentsContext";
import { generateId } from "@renderer/utils/helpers";

import navdata from "./data/ConfigData";
import CodeMirrorContent from "./components/CodeMirrorContent";
import { Component, PageConfig } from "@igrp/nextjs-engine/dist/interfaces/types";
import useToast from "@renderer/components/useToast";
import { HierarchicalComponent } from "./interfaces";

import { DragDropContext } from 'react-beautiful-dnd';
import { handleDragEnd } from "./dnd/DraggableItemManager";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { AppSidebar } from "@renderer/layouts/components/app-ui-sidebar";
import { SidebarInset, SidebarProvider } from "@renderer/components/ui/sidebar";
import { buildJsonStructure } from "@renderer/utils/jsonStructureUtil";

const addRow = () => {
    const newRowId = generateId("row");
    const newRow: HierarchicalComponent = {
        id: newRowId,
        columns: [{ id: generateId("col"), colSize: 12, components: [] }],
    };

    return newRow;
};

interface FormEngineProps {
    basePath: string | undefined;
    page: string;
    pagePath: string | undefined;
    isDesign: boolean;
    onSave: () => void;
}

interface FormEngineRef {
    handleSave: () => void;
}

const FormEngine = forwardRef<FormEngineRef, FormEngineProps>(({ basePath, pagePath, page, isDesign }, ref) => {

    const { reorderComponents, moveComponent, getComponentsByRow, setInitComponents, getAllComponents, removeRow, addDroppedComponent, getComponent, setEditingComponent, updateComponent } = useDroppedComponents();

    const components = getAllComponents();

    //const [isDesign, setIsDesign] = useState(true);

    const { showErrorToast, showSuccessToast } = useToast();

    const navData = navdata().props.children;

    // Internal handleSave function in FormEngine
    const internalHandleSave = () => {
        console.log("FormEngine save triggered");
        const jsonStructure = buildJsonStructure(components);
        handleSave(jsonStructure)
    };

    // Expose handleSave to parent via ref
    useImperativeHandle(ref, () => ({
        handleSave: internalHandleSave,
    }));

    const handleClickAddControl = (id: string, type: string) => {
        const newRow = addRow();
        const rowIndex = components.findIndex(row => row.id === id);

        if (rowIndex !== -1) {
            const newRows = [...components];
            if (type === "top") {
                newRows.splice(rowIndex, 0, newRow);
            } else if (type === "bottom") {
                newRows.splice(rowIndex + 1, 0, newRow);
            }
            setInitComponents(newRows);
        }
    };

    const handleClickDeleteSection = (id: string) => {
        removeRow(id)
    }

    useEffect(() => {
        if (components.length === 0) {
            const newRow = addRow();
            setInitComponents([newRow]);
        }
    }, [components])

    const handleSave = async (jsonStructure: Component[]) => {
        try {

            if (pagePath === undefined || basePath === undefined) return;

            const pageConfig: PageConfig = {
                type: 'page',
                pageName: page,
                path: page
            }

            const { error } = await window.api.addComponentToPage(pageConfig, jsonStructure, basePath);

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

                    let dataSaved: HierarchicalComponent[] = [];

                    data.components.map(row => {
                        dataSaved = [
                            ...dataSaved,
                            {
                                id: generateId("row"),
                                columns: row.Row.map(col => ({
                                    id: col.id || generateId("col"),
                                    colSize: 12,
                                    components: col.Col.flatMap(c => c.components.map(comp => ({ ...comp })))
                                }))
                            }
                        ]
                    })

                    setInitComponents(dataSaved)

                }

            } catch (error) {
                console.error('Failed to load JSON content:', error);
            }
        }
        getJsonData();
    }, [basePath, page])

    const droppedComponentsMethods = {
        reorderComponents,
        getComponentsByRow,
        addDroppedComponent,
        getComponent,
        setEditingComponent,
        setInitComponents,
        removeRow,
        moveComponent,
        updateComponent
    };

    const onDragEnd = (result: any) => {
        handleDragEnd(result, droppedComponentsMethods);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "350px",
                    } as React.CSSProperties
                }
            >
                <AppSidebar data={navData} />
                <SidebarInset>
                    <div className="flex flex-1 flex-col gap-4 px-4">
                        <ScrollArea className="h-[calc(100vh-100px)] overflow-y-auto pr-3">
                            {isDesign ? (
                                <>
                                    <div className="igrp-page-header"></div>
                                    <div className="space-y-6 my-6" >
                                        {components.map(row => (
                                            <RowContainer
                                                key={row.id}
                                                id={row.id}
                                                onClickAddControl={handleClickAddControl}
                                                onClickDeleteSection={handleClickDeleteSection}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <CodeMirrorContent />
                            )}
                        </ScrollArea>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </DragDropContext>
    );
});
export default FormEngine;