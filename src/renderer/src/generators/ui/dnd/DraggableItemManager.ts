import { generateId } from "@renderer/utils";
import { Destination, DragEndResult, Source, StructuredComponent } from "@renderer/lib/dnd/types";
import { ComponentRegisterConfig, State } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { getDefaultInteractions, getDefaultProperties, getRequiredDataSchema } from "./helpers";

interface DragEndHandlers {
    handleAddChildToComponent: (destination: Destination, component: StructuredComponent) => void;
    handleReorderChildInComponent: (draggableId: string, source: Source, destination: Destination) => void;
    generateTag: (name: string) => string;
    addState?: (state: State) => void;
    findComponentById: (componentName: string) => Promise<ComponentRegisterConfig | undefined>;
}

export const handleDragEnd = async (
    result: DragEndResult,
    handlers: DragEndHandlers
): Promise<void> => {

    const { draggableId, source, destination, mode, type }: DragEndResult = result;

    if (!destination) {
        return;
    }

    if (mode === 'MOVE') {
        handlers.handleReorderChildInComponent(draggableId, source, destination);
    } else {
        await handleDropComponent(draggableId, source, destination, type, handlers);
    }
}

const handleDropComponent = async (
    draggableId: string,
    source: Source,
    destination: Destination,
    type: string,
    handlers: DragEndHandlers
): Promise<void> => {

    const { label, properties, childrenTypes, interactions: interactionsProperties, allowTypes, data: dataProperties, defaultChildren } = source

    const componentId = generateId(draggableId);

    const tag = handlers.generateTag(draggableId);

    const data = getRequiredDataSchema(dataProperties);

    const interactions = getDefaultInteractions(interactionsProperties);

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

    if (childrenTypes) {
        const childPromises = childrenTypes
            .filter((child) => child.defaultValue)
            .map(async (child: ComponentRegisterConfig) => {
                const childComponent = await createStructuredComponentRecursive(child, handlers.generateTag, handlers);
                return childComponent;
            });
        const childComponents = await Promise.all(childPromises);
        component.children?.push(...childComponents);
    }

    if (defaultChildren) {
        for (const child of defaultChildren) {
            if (childrenTypes && !childrenTypes.some(childType => childType.name === child.name)) {
                const register = await handlers.findComponentById(child.name)
                if (register) {
                    const childComponent = await createStructuredComponentRecursive(register, handlers.generateTag, handlers);
                    component.children?.push(childComponent);
                }
            }
        }
    }

    // Add the component to the row
    handlers.handleAddChildToComponent(destination, component);

};

// Recursive helper to create a StructuredComponent with nested childrenTypes
async function createStructuredComponentRecursive(child: ComponentRegisterConfig, generateTag: (name: string) => string, handlers: DragEndHandlers) {
    const { name, label, properties, interactions: interactionsProperties, allowTypes,
        data: dataProperties, childrenTypes, defaultChildren } = child;
    const childId = generateId(name);
    const tag = generateTag(name);
    const data = getRequiredDataSchema(dataProperties);
    const interactions = getDefaultInteractions(interactionsProperties);

    // Recursively create children if childrenTypes exist
    let children: StructuredComponent[] = [];
    if (childrenTypes && Array.isArray(childrenTypes)) {
        const childPromises = childrenTypes
            .filter((grandChild) => grandChild.defaultValue)
            .map((grandChild: ComponentRegisterConfig) => createStructuredComponentRecursive(grandChild, generateTag, handlers));
        children = await Promise.all(childPromises);
    }

    // Handle defaultChildren recursively
    if (defaultChildren) {
        for (const defaultChild of defaultChildren) {
            if (childrenTypes && !childrenTypes.some(childType => childType.name === defaultChild.name)) {
                const register = await handlers.findComponentById(defaultChild.name)
                if (register) {
                    const defaultChildComponent = await createStructuredComponentRecursive(register, generateTag, handlers);
                    children.push(defaultChildComponent);
                }
            }
        }
    }

    const childComponent: StructuredComponent = {
        id: childId,
        tag,
        componentName: name,
        label: label,
        children,
        interactions,
        allowTypes,
        data,
        properties: getDefaultProperties(properties),
    };
    return childComponent;
}


