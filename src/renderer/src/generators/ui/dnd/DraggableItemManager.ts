import { generateId } from "@renderer/utils/helpers";
import { Containers, STRUCTURES } from "../ComponentTypes";
import { Destination, StructuredComponent } from "@renderer/lib/dnd/types";

export const handleDragEnd = (
    result: any,
    { handleAddChildToComponent, getComponent, handleReorderChildInComponent }: any
) => {
    const { draggableId, source, destination, mode } = result;

    if (!destination) {
        return;
    }

    if (mode === 'MOVE') {
        if (source.droppableId === destination.droppableId) {
            handleReorderChildInComponent(draggableId, source, destination);
        }
    } else {
        handleDropComponent(draggableId, destination, { handleAddChildToComponent, getComponent });

    }
};

const handleDropComponent = (
    draggableId: string,
    destination: Destination,
    { handleAddChildToComponent }: any
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
        component.properties = { gridCol: 2 };

        // Create two child columns and add them to the parent's children array
        for (let i = 0; i < 2; i++) {
            const childColumnId = generateId(`column_${i + 1}`);
            const childColumn: StructuredComponent = {
                id: childColumnId,
                componentName: `Column`,
                label: `Column ${i + 1}`,
                properties: {},
                children: [],
            };
            component.children?.push(childColumn);
        }
    }

    // Handle other components (Grid, Form, etc.)
    if (draggableId === STRUCTURES.Grid) {
        component.properties = {
            gridCol: 4,
        };
    }

    if (draggableId === Containers.Form) {
        component.properties = {
            gridCol: 4,
        };
    }

    // Add the component to the row
    handleAddChildToComponent(destination, component);

};
