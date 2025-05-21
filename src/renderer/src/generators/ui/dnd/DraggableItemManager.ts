import { generateId } from "@renderer/utils/helpers";
import { Destination, DragEndResult, Source, StructuredComponent } from "@renderer/lib/dnd/types";
import { ComponentRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { getDefaultInteractions, getDefaultProperties, getRequiredDataSchema } from "./helpers";

export const handleDragEnd = (
    result: any,
    { handleAddChildToComponent, handleReorderChildInComponent, generateTag, addState }: any
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
        handleDropComponent(draggableId, source, destination, type, { handleAddChildToComponent, generateTag, addState });
    }
};

const handleDropComponent = (
    draggableId: string,
    source: Source,
    destination: Destination,
    type: string,
    { handleAddChildToComponent, generateTag }: any
) => {
    const { label, properties, childrenTypes, interactions: interactionsProperties, allowTypes, data: dataProperties } = source

    const componentId = generateId(draggableId);

    const tag = generateTag(draggableId);

    const data = getRequiredDataSchema(dataProperties);

    const interactions = getDefaultInteractions(interactionsProperties, tag);

    // Create the component object
    const component: StructuredComponent = {
        id: componentId,
        tag,
        componentName: draggableId,
        label,
        type,
        children: [],
        interactions,
        allowTypes,
        data: data,
        properties: getDefaultProperties(properties),
    };

    childrenTypes && childrenTypes.filter((child) => child.defaultValue).map((child: ComponentRegisterConfig) => {
        const { name, label, properties, interactions: interactionsProperties, allowTypes, data: dataProperties } = child
        const childId = generateId(name);
        const tag = generateTag(name)
        const data = getRequiredDataSchema(dataProperties);
        const interactions = getDefaultInteractions(interactionsProperties, tag);

        const childComponent: StructuredComponent = {
            id: childId,
            tag,
            componentName: name,
            label: label,
            children: [],
            interactions,
            allowTypes,
            data,
            properties: getDefaultProperties(properties),
        };
        component.children?.push(childComponent);

    });

    // Add the component to the row
    handleAddChildToComponent(destination, component);

};


