import { generateId } from "@renderer/utils/helpers";
import { Containers, STRUCTURES } from "../ComponentTypes";
import { Destination, StructuredComponent } from "@renderer/lib/dnd/types";

export const handleDragEnd = (
    result: any,
    isDrop: boolean,
    { handleAddComponentToRow, handleAddChildToComponent, moveComponent, reorderComponents, getComponent, setEditingComponent, updateComponent }: any
) => {
    const { draggableId, source, destination, type } = result;

    if (!destination) {
        return;
    }

    const isRow = destination.droppableId.startsWith("row_");

    if (isRow) {
        if (isDrop) {
            handleDropComponent(draggableId, destination, { handleAddComponentToRow, getComponent, setEditingComponent });
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
            handleDropField(draggableId, destination, { handleAddChildToComponent });
        }
    }
};

const handleDropComponent = (
    draggableId: string,
    destination: Destination,
    { handleAddComponentToRow }: any
) => {
    // Generate a unique ID for the component
    const componentId = generateId(draggableId);

    // Create the component object
    const component: StructuredComponent = {
        id: componentId,
        componentName: draggableId,
        label: draggableId,
        children: [], // Initialize children array
    };

    // Handle Columns component
    if (draggableId === STRUCTURES.Columns) {
        // Add gridCol configuration for the parent Columns component
        component.props = { gridCol: 2 };

        // Create two child columns and add them to the parent's children array
        for (let i = 0; i < 2; i++) {
            const childColumnId = generateId(`column_${i + 1}`);
            const childColumn: StructuredComponent = {
                id: childColumnId,
                componentName: `Column`,
                label: `Column ${i + 1}`,
                props: {},
                children: [],
            };
            component.children?.push(childColumn);
        }
    }

    // Handle other components (Grid, Form, etc.)
    if (draggableId === STRUCTURES.Grid) {
        component.props = {
            gridCol: 4,
        };
    }

    if (draggableId === Containers.Form) {
        component.props = {
            gridCol: 4,
        };
    }

    // Add the component to the row
    handleAddComponentToRow(destination, component);

};

export const handleDropField = (draggableId, destination, { handleAddChildToComponent }) => {

    const label = draggableId
    const componentId = destination.droppableId;

    const fieldId = generateId(componentId + '_' + draggableId);

    const fieldConfig = {
        type: draggableId,
        name: fieldId,
        label: label,
        placeholder: `Enter your ${label}`,
        gridCol: 4,
    }

    const newField: StructuredComponent = {
        id: fieldId,
        componentName: draggableId,
        label: label,
        props: fieldConfig,
        children: []
    };

    handleAddChildToComponent(destination, newField)
}

export const reorderField = (source, destination, { updateComponent, getComponent }) => {

    const componentId = destination.droppableId;
    const insertIndex = destination.index;
    const formComponent: Partial<StructuredComponent> = getComponent(componentId) ?? {};
    const fieldToMove = formComponent.children[source.index];

    const fieldsWithoutMoved = formComponent.children.filter((_, index) => index !== source.index);

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