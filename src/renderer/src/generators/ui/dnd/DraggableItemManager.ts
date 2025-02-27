import { Field, FieldConfig } from "@igrp/nextjs-engine/dist/interfaces/types";
import { generateId } from "@renderer/utils/helpers";
import { ComponentData, Destination, DroppedComponent } from "../interfaces";
import { COMPONENT, Containers, FIELD, STRUCTURE, STRUCTURES } from "../ComponentTypes";

export const handleDragEnd = (
    result: any,
    isDrop: boolean,
    { handleAddComponentToRow, handleAddChildToComponent, moveComponent, reorderComponents, addDroppedComponent, getComponent, setEditingComponent, updateComponent }: any
) => {
    const { draggableId, source, destination, type } = result;

    console.log(destination);

    if (!destination) {
        return;
    }

    const isRow = destination.droppableId.startsWith("row_");

    if (isRow) {
        if (isDrop) {
            handleDropComponent(draggableId, destination, { handleAddComponentToRow, addDroppedComponent, getComponent, setEditingComponent });
        } else if (source.droppableId === destination.droppableId) {
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
    } else {
        if (source.droppableId === destination.droppableId) {
            reorderField(source, destination, { updateComponent, getComponent });
        } else {
            handleDropField(draggableId, destination, { updateComponent, handleAddChildToComponent, getComponent });
        }
    }
};

export const handleDropComponent = (
    draggableId: string,
    destination: Destination,
    { handleAddComponentToRow, addDroppedComponent, getComponent, setEditingComponent }: any
) => {
    // Generate a unique ID for the component
    const componentId = generateId(draggableId);

    // Create the component object
    const component: ComponentData = {
        id: componentId,
        componentName: draggableId,
        label: draggableId,
        config: null,
        children: [], // Initialize children array
    };

    // Handle Columns component
    if (draggableId === STRUCTURES.Columns) {
        // Add gridCol configuration for the parent Columns component
        component.config = { gridCol: 2 };

        // Create two child columns and add them to the parent's children array
        for (let i = 0; i < 2; i++) {
            const childColumnId = generateId(`Column_${i + 1}`);
            const childColumn: ComponentData = {
                id: childColumnId,
                componentName: `Column`,
                label: `Column ${i + 1}`,
                config: null,
                children: [],
            };
            component.children?.push(childColumn);
        }
    }

    // Handle other components (Grid, Form, etc.)
    if (draggableId === STRUCTURES.Grid) {
        component.config = {
            gridCol: 4,
        };
    }

    if (draggableId === Containers.Form) {
        component.config = {
            gridCol: 4,
        };
    }

    // Add the component to the row
    handleAddComponentToRow(destination, component);

    // Set the component as the editing component
    //setEditingComponent(component);
};

export const handleDropField = (draggableId, destination, { updateComponent, handleAddChildToComponent, getComponent }) => {

    console.log(draggableId, destination)

    const label = draggableId
    const componentId = destination.droppableId;
    const insertIndex = destination.index;
    /*     const formComponent: Partial<DroppedComponent> = getComponent(componentId) ?? {};
     */
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

    /*  const updatedFields = [
         ...formComponent.fields.slice(0, insertIndex),
         newField,
         ...formComponent.fields.slice(insertIndex)
     ]; */

    /* updateComponent(componentId, {
        ...formComponent,
        fields: updatedFields,
    }); */

    handleAddChildToComponent(destination, newField)
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