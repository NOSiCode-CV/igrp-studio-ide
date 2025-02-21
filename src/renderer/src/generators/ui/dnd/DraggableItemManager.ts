import { ColumnComponent, ColumnConfig, Field, FieldConfig } from "@igrp/nextjs-engine/dist/interfaces/types";
import { generateId } from "@renderer/utils/helpers";
import { DroppedComponent } from "../interfaces";
import { ComponentProps } from "./DroppedComponentsContext";
import { COMPONENT, FIELD } from "../ComponentTypes";

export const handleDragEnd = (
    result: any,
    component: any,
    { moveComponent, reorderComponents, addDroppedComponent, getComponent, setEditingComponent, updateComponent }: any
) => {

    const { draggableId, source, destination, type } = result;

    if (!destination) {
        return;
    }

    switch (type) {
        case COMPONENT:
            if (component !== null && component !== undefined) {
                handleDropComponent(draggableId, destination, { addDroppedComponent, getComponent, setEditingComponent });
            }
            else if (source.droppableId === destination.droppableId) {
                const path = destination.droppableId.split("-");
                reorderComponents({ rowId: path[0], columnId: path[1], startIndex: source.index, endIndex: destination.index });
            } else {
                const pathDestination = destination.droppableId.split("-");
                const pathSource = source.droppableId.split("-");
                moveComponent({
                    sourceRowId: pathSource[0],
                    sourceColumnId: pathSource[1],
                    destinationRowId: pathDestination[0],
                    destinationColumnId: pathDestination[1],
                    sourceIndex: source.index,
                    destinationIndex: destination.index
                });
            }
            break;

        case FIELD:
            if (component !== null && component !== undefined) {
                handleDropField(draggableId, destination, { updateComponent, getComponent });
            }
            else if (source.droppableId === destination.droppableId) {
                reorderField(source, destination, { updateComponent, getComponent });
            }
            break;

        default:
            console.warn("Unknown drag type:", type);
            break;
    }

};


export const handleDropComponent = (draggableId, destination, { addDroppedComponent, getComponent, setEditingComponent }: any) => {

    const path = destination.droppableId.split("-");

    const componentId = generateId(draggableId);

    const config: ColumnConfig = {
        title: draggableId,
        colSize: 12
    };

    const columnComponent: ColumnComponent = {
        id: componentId,
        componentName: draggableId,
        config: config,
        fields: [],
    };

    const props: ComponentProps = {
        data: { rowId: path[0], columnId: path[1], colSize: 12 },
        componentId: componentId,
        props: columnComponent,
        index: destination.index
    }

    // Adiciona o componente à coluna
    addDroppedComponent(props);

    //open component dropped
    const comp: Partial<DroppedComponent> = getComponent(componentId) ?? {};
    if (comp)
        setEditingComponent(comp);
}

export const handleDropField = (draggableId, destination, { updateComponent, getComponent }) => {

    const label = draggableId
    const componentId = destination.droppableId;
    const insertIndex = destination.index;
    const formComponent: Partial<DroppedComponent> = getComponent(componentId) ?? {};
    const fieldId = generateId(componentId + '_' + draggableId);

    const fieldConfig: FieldConfig = {
        type: draggableId,
        name: fieldId,
        label: label,
        placeholder: `Enter your ${label}`,
        colSize: 4
    }

    const field: Field = {
        type: draggableId,
        config: fieldConfig
    }

    const newField: DroppedComponent = {
        id: fieldId,
        componentName: draggableId,
        ...field,
    };

    const updatedFields = [
        ...formComponent.fields.slice(0, insertIndex),
        newField,
        ...formComponent.fields.slice(insertIndex)
    ];

    updateComponent(componentId, {
        ...formComponent,
        fields: updatedFields,
    });
}

export const reorderField = (source, destination, { updateComponent, getComponent }) => {

    const componentId = destination.droppableId;
    const insertIndex = destination.index;
    const formComponent: Partial<DroppedComponent> = getComponent(componentId) ?? {};
    const fieldToMove = formComponent.fields[source.index];

    const fieldsWithoutMoved = formComponent.fields.filter((_, index) => index !== source.index);

    const updatedFields = [
        ...fieldsWithoutMoved.slice(0, insertIndex),
        fieldToMove,
        ...fieldsWithoutMoved.slice(insertIndex)
    ];

    updateComponent(componentId, {
        ...formComponent,
        fields: updatedFields,
    });
}