import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
} from 'react';
import { useSidebar } from '@renderer/components/ui/sidebar';
import {
    Destination,
    StructuredComponent,
    StructuredLayout,
} from '@renderer/lib/dnd/types';
import { generateId } from '@renderer/utils/helpers';

interface DroppedComponentsContextType {
    newStructure: (name: string) => StructuredComponent;
    setInitComponents: (components: StructuredLayout) => void;
    getAllComponents: () => StructuredLayout;

    handleAddChildToComponent: (
        destination: Destination,
        childComponent: StructuredComponent
    ) => void;

    handleRemoveChildFromComponent: (destination: Destination) => void;

    handleReorderChildInComponent: (
        draggableId: string,
        source: Destination,
        destination: Destination
    ) => void;

    updateComponent: (
        id: string,
        updatedComponent: StructuredComponent
    ) => void;

    removeRow: (rowId: string) => void;
    setEditingComponent: (component: StructuredComponent) => void;
    clearEditingComponent: () => void;
    currentComponent: StructuredComponent | null;
}

const DroppedComponentsContext = createContext<
    DroppedComponentsContextType | undefined
>(undefined);

const newStructuredComponent = (
    name: string,
    children?: Array<StructuredComponent>
) => {
    const newRowId = generateId(name);
    const newRow: StructuredComponent = {
        id: newRowId,
        componentName: name,
        label: name,
        properties: {
            variant: 'default',
        },
        children: children || [],
    };

    return newRow;
};

export const DroppedComponentsProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { toggleSidebar, setOpen } = useSidebar();

    const [components, setComponents] = useState<StructuredLayout>(
        newStructuredComponent('page', [newStructuredComponent('section')])
    );
    const [currentComponent, setCurrentComponent] =
        useState<StructuredComponent | null>(null);

    const setInitComponents = (components: StructuredLayout) => {
        setComponents(components);
    };

    const newStructure = (name: string) => {
        return newStructuredComponent(name);
    };

    const handleAddChildToComponent = useCallback(
        (
            destination: Destination, // Contains droppableId (component ID) and index
            childComponent: StructuredComponent
        ) => {
            // Validate inputs
            if (!childComponent || !destination || !destination.droppableId) {
                console.error('Invalid child component or destination');
                return;
            }

            // Recursive function to find and update the target component
            const updateComponentTree = (
                component: StructuredComponent
            ): StructuredComponent => {
                // If the current component matches the destination ID, add the child
                if (component.id === destination.droppableId) {
                    const updatedChildren = [...(component.children || [])];
                    updatedChildren.splice(
                        destination.index,
                        0,
                        childComponent
                    );
                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }

                // If the current component has children, search recursively
                if (component.children) {
                    const updatedChildren =
                        component.children.map(updateComponentTree);
                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }

                // If no match is found, return the component unchanged
                return component;
            };

            // Update the components state
            setComponents((prev) => ({
                ...prev,
                children: (prev.children || []).map(updateComponentTree),
            }));
        },
        []
    );

    const handleReorderChildInComponent = useCallback(
        (
            draggableId: string,
            source: Destination,
            destination: Destination
        ) => {
            // Validate inputs
            if (
                !source ||
                !destination ||
                !source.droppableId ||
                !destination.droppableId
            ) {
                console.error('Invalid source or destination');
                return;
            }

            // Check if source and destination are the same
            if (source.droppableId !== destination.droppableId) {
                console.error(
                    'Source and destination droppableId must be the same for reorder'
                );
                return;
            }

            // Recursive function to find and reorder the target component
            const updateComponentTree = (
                component: StructuredComponent
            ): StructuredComponent => {

                // If the current component matches the parent ID, reorder its children
                if (component.id === source.droppableId) {
                  
                    const updatedChildren = [...(component.children || [])];

                    // Remove the source component from its current position
                    const [movedComponent] = updatedChildren.splice(
                        source.index,
                        1
                    );
                  
                    // Insert the source component into the new position
                    updatedChildren.splice(
                        destination.index,
                        0,
                        movedComponent
                    );
                 
                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }

                // If the current component has children, search recursively
                if (component.children) {
                    const updatedChildren =
                        component.children.map(updateComponentTree);
                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }

                // If no match is found, return the component unchanged
                return component;
            };

            // Update the components state
            setComponents((prev) => {
                console.log('Previous state:', prev);
                const updatedComponents = {
                    ...prev,
                    children: (prev.children || []).map(updateComponentTree),
                };

                console.log('Updated components:', updatedComponents);
                return updatedComponents;
            });
        },
        []
    );

    const handleRemoveChildFromComponent = useCallback(
        (destination: Destination) => {
            // Validate inputs
            if (!destination || !destination.droppableId) {
                console.error('Invalid destination');
                return;
            }

            // Recursive function to find and remove the target component by ID
            const updateComponentTree = (
                component: StructuredComponent
            ): StructuredComponent | null => {
                // If the current component matches the target ID, return null to remove it
                if (component.id === destination.droppableId) {
                    console.log('Found and removed component:', component.id);
                    return null;
                }

                // If the current component has children, search for the target ID
                if (component.children) {
                    const updatedChildren = component.children
                        .map(updateComponentTree) // Recursively update the children
                        .filter(
                            (child): child is StructuredComponent =>
                                child !== null
                        ); // Filter out null values

                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }

                // If no match is found, return the component unchanged
                return component;
            };

            // Update the components state
            setComponents((prev) => {
                const updatedComponents = {
                    ...prev,
                    children: (prev.children || [])
                        .map(updateComponentTree)
                        .filter(
                            (child): child is StructuredComponent =>
                                child !== null
                        ), // Filter out null values
                };

                return updatedComponents;
            });
        },
        []
    );
    //Funcao para fazer update de um component
    const updateComponent = (
        id: string,
        updatedComponent: StructuredComponent
    ) => {
        setComponents((prevComponents) => ({
            ...prevComponents,
            children: prevComponents.children.map((comp) =>
                comp.id === id ? { ...comp, ...updatedComponent } : comp
            ),
        }));
    };

    // Função que remove uma linha
    const removeRow = useCallback((rowId: string) => {
        setComponents((prevComponents) => {
            const updatedComponents = {
                ...prevComponents,
                children: (prevComponents.children || []).filter(
                    (row) => row.id !== rowId
                ),
            };

            return updatedComponents;
        });
    }, []);

    // Função que obtém todos os componentes
    const getAllComponents = (): StructuredLayout => components;

    const setEditingComponent = (component: StructuredComponent) => {
        setCurrentComponent(component);
        toggleSidebar();
        setOpen(false);
    };

    const clearEditingComponent = () => {
        setCurrentComponent(null);
    };

    return (
        <DroppedComponentsContext.Provider
            value={{
                newStructure,
                setInitComponents,
                handleAddChildToComponent,
                handleRemoveChildFromComponent,
                handleReorderChildInComponent,
                updateComponent,
                removeRow,
                getAllComponents,
                setEditingComponent,
                clearEditingComponent,
                currentComponent,
            }}
        >
            {children}
        </DroppedComponentsContext.Provider>
    );
};

export const useDroppedComponents = (): DroppedComponentsContextType => {
    const context = useContext(DroppedComponentsContext);
    if (context === undefined) {
        throw new Error(
            'useDroppedComponents must be used within a DroppedComponentsProvider'
        );
    }
    return context;
};
