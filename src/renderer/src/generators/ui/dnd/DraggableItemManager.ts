import { generateId } from "@renderer/utils/helpers";
import { Destination, DragEndResult, Source, StructuredComponent } from "@renderer/lib/dnd/types";
import { ComponentRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";

export const handleDragEnd = (
    result: any,
    { handleAddChildToComponent, handleReorderChildInComponent }: any
) => {

    // const { getAcceptedChildren } = useStudio()

    const { draggableId, source, destination, mode, type }: DragEndResult = result;

    // const { droppableId } = destination;

    if (!destination) {
        return;
    }


    /*  useCallback(() => {
         getAcceptedChildren(parentComponentName, componentName).then((data) => {
             setComponents(data);
         });
     }, [parentComponentName, componentName, getAcceptedChildren]); */


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
    const { label, properties, childrenTypes, interactions } = source

    const componentId = generateId(draggableId);

    // Create the component object
    const component: StructuredComponent = {
        id: componentId,
        componentName: draggableId,
        label,
        type,
        properties: setDefaultProperties(properties),
        children: [],
        interactions: setDefaultInteractions(interactions)
    };

    childrenTypes && childrenTypes.filter((child) => child.defaultValue).map((child: ComponentRegisterConfig) => {
        const { name, label, properties, interactions } = child
        const childId = generateId(name);
        const childComponent: StructuredComponent = {
            id: childId,
            componentName: name,
            label: label,
            properties: setDefaultProperties(properties),
            children: [],
            interactions: setDefaultInteractions(interactions)
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
        else if (schema[key].type === 'array' && schema[key].items?.enum === undefined) {
            properties[key] = [];
        }
    }
    return properties;
};

// Utility function to set default values based on the schema
const setDefaultInteractions = (schema: any) => {
    const interactions: any = {};
    for (const key in schema) {
        if (schema[key].properties.fnCustomSet.default !== undefined) {
            interactions[key] = {
                ['fnCustomSet']: schema[key].properties.fnCustomSet.default
            };
        }
    }
    return interactions;
};