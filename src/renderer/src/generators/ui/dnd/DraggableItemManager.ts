import { generateId } from "@renderer/utils/helpers";
import { Destination, DragEndResult, Source, StructuredComponent } from "@renderer/lib/dnd/types";
import { ComponentRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";

export const handleDragEnd = (
    result: any,
    { handleAddChildToComponent, handleReorderChildInComponent, generateTag }: any
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
        handleDropComponent(draggableId, source, destination, type, { handleAddChildToComponent, generateTag });
    }
};

const handleDropComponent = (
    draggableId: string,
    source: Source,
    destination: Destination,
    type: string,
    { handleAddChildToComponent, generateTag }: any
) => {
    const { label, properties, childrenTypes, interactions, allowTypes } = source

    const componentId = generateId(draggableId);

    const tag = generateTag(draggableId);

    // Create the component object
    const component: StructuredComponent = {
        id: componentId,
        tag,
        componentName: draggableId,
        label,
        type,
        properties: setDefaultProperties(properties),
        children: [],
        interactions: setDefaultInteractions(interactions, tag),
        allowTypes
    };

    childrenTypes && childrenTypes.filter((child) => child.defaultValue).map((child: ComponentRegisterConfig) => {
        const { name, label, properties, interactions, allowTypes } = child
        const childId = generateId(name);
        const tag = generateTag(name)
        const childComponent: StructuredComponent = {
            id: childId,
            tag,
            componentName: name,
            label: label,
            properties: setDefaultProperties(properties),
            children: [],
            interactions: setDefaultInteractions(interactions, tag),
            allowTypes
        };
        component.children?.push(childComponent);
    });

    // Add the component to the row
    handleAddChildToComponent(destination, component);

};


// Utility function to set default values based on the schemaconst setDefaultProperties = (schema: any): any => {const setDefaultProperties = (schema: any): any => {
const setDefaultProperties = (schema: any): any => {
    const properties: any = {};

    for (const key in schema) {

        const prop = schema[key];

        if (prop.type === 'array' && !prop.items?.enum) {
            properties[key] = [];
        } else if (prop.type === 'object' && prop.properties) {
            properties[key] = setDefaultProperties(prop.properties); // Recursive call
        } else
            properties[key] = prop.default
    }

    return properties;
};


// Utility function to set default values based on the schema
const setDefaultInteractions = (schema: any, tag: string) => {
    const interactions: any = {};
    for (const key in schema) {
        if (schema[key].properties?.fnCustomSet.default !== undefined) {
            interactions[key] = {
                ['fnCustomSet']: schema[key].properties.fnCustomSet.default.replace('{{id}}', tag)
            };
        }
    }
    return interactions;
};



