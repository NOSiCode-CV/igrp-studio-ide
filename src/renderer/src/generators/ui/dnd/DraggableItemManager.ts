import { generateId } from "@renderer/utils/helpers";
import { Destination, Source, StructuredComponent } from "@renderer/lib/dnd/types";
import { ComponentRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";

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
    const { label, properties, childrenTypes } = source
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

    childrenTypes && childrenTypes.filter((child) => child.defaultValue).map((child: ComponentRegisterConfig) => {
        const { name, label, properties } = child
        const childId = generateId(name);
        const childComponent: StructuredComponent = {
            id: childId,
            componentName: name,
            label: label,
            properties: setDefaultProperties(properties),
            children: [],
        };
        component.children?.push(childComponent);
    });

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