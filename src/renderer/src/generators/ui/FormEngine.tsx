import React, { useEffect, useState } from "react";
import RowContainer from "./types/containers/rows";
import { useDroppedComponents } from "./dnd/DroppedComponentsContext";
import { generateId } from "@renderer/utils/helpers";
import BreadCrumb from "./components/BreadCrumb";

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

const addRow = () => {
    const newRowId = generateId("row");
    const newRow: HierarchicalComponent = {
        id: newRowId,
        columns: [{ id: generateId("col"), colSize: 12, components: [] }],
    };

    return newRow;
};

/* const ContainerDesigner = styled.div`
    height: calc(100vh - 90px); 
`;
 */
const FormEngine = ({ basePath, page, pagePath }) => {

    const { reorderComponents, moveComponent, getComponentsByRow, setInitComponents, getAllComponents, removeRow, addDroppedComponent, getComponent, setEditingComponent, updateComponent } = useDroppedComponents();

    const components = getAllComponents();

    const [isDesign, setIsDesign] = useState(true);

    const { showErrorToast, showSuccessToast } = useToast();

    const navData = navdata().props.children;
    /*   let settings = useLayoutSettings({});
  
      const memoizedSidebarProps = useMemo(() => ({
          layoutType: LAYOUT_TYPES.TWOCOLUMN,
          leftsidbarSizeType: settings.leftsidbarSizeType,
          sidebarVisibilitytype: settings.sidebarVisibilitytype,
          navData: navData
      }), [settings.layoutType, navData]); */

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

    const handleCLickIsDesign = () => {
        setIsDesign(!isDesign)
    }

    //TODO for refactor after accert new json model
    useEffect(() => {
        const getJsonData = async () => {
            try {
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
                {/*   <BreadCrumb
                    isDesign={isDesign}
                    onClickIsDesign={handleCLickIsDesign}
                    onSave={(json) => handleSave(json)}
                /> */}
                <AppSidebar data={navData} />
                <SidebarInset>
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        <ScrollArea className="h-screen overflow-y-auto">
                            {isDesign ? (

                                <div className="content gen-viewers active" id="gen-design">

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

                                </div>

                            ) : (
                                <CodeMirrorContent />
                            )}
                        </ScrollArea>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </DragDropContext>
    );
}
export default FormEngine