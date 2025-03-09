import { generateId } from "@renderer/utils/helpers";
import { CONTAINERS, STRUCTURES } from "../ComponentTypes";
import { Destination, Source, StructuredComponent } from "@renderer/lib/dnd/types";

export const handleDragEnd = (
    result: any,
    { handleAddChildToComponent, handleReorderChildInComponent }: any
) => {
    const { draggableId, source, destination, mode, type } = result;

    if (!destination) {
        return;
    }

    if (mode === 'MOVE') {
        handleReorderChildInComponent(draggableId, source, destination);
    } else {
        handleDropComponent(draggableId, source, destination, type, { handleAddChildToComponent });
    }
};

const handleDropComponent = (
    draggableId: string,
    source: Source,
    destination: Destination,
    type: string,
    { handleAddChildToComponent }: any
) => {
    const { label, properties } = source
    // Generate a unique ID for the component
    const componentId = generateId(draggableId);

    // Create the component object
    const component: StructuredComponent = {
        id: componentId,
        componentName: draggableId,
        label,
        type,
        properties: setDefaultProperties(properties),
        children: [], // Initialize children array
    };

    // Handle Columns component
    if (draggableId === STRUCTURES.Columns) {

        // Create two child columns and add them to the parent's children array
        for (let i = 0; i < 2; i++) {
            const childColumnId = generateId(`column_${i + 1}`);
            const childColumn: StructuredComponent = {
                id: childColumnId,
                componentName: STRUCTURES.Column,
                label: `Column ${i + 1}`,
                properties: { variant: 'span6' },
                children: [],
            };
            component.children?.push(childColumn);
        }
    }

    // Add the component to the row
    handleAddChildToComponent(destination, component);

};


// Utility function to set default values based on the schema
const setDefaultProperties = (schema: any) => {
    const properties: any = {};
    for (const key in schema) {
        if (schema[key].default !== undefined) {
            properties[key] = schema[key].default;
        }
    }
    return properties;
};