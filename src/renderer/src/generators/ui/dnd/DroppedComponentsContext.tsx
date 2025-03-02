import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
} from 'react';
import { reorder } from './helpers';
import { useSidebar } from '@renderer/components/ui/sidebar';
import {
    Destination,
    StructuredComponent,
    StructuredRow,
} from '@renderer/lib/dnd/types';

interface DroppedComponentsContextType {
    setInitComponents: (components: StructuredRow[]) => void;
    getAllComponents: () => StructuredRow[];
    getComponents: (rowId: string, columnId: string) => StructuredComponent[];

    handleAddComponentToRow: (
        destination: Destination,
        childComponent: StructuredComponent
    ) => void;

    handleAddChildToComponent: (
        destination: Destination,
        childComponent: StructuredComponent
    ) => void;

    handleRemoveChildFromComponent: (destination: Destination) => void;

    updateComponent: (
        id: string,
        updatedComponent: StructuredComponent
    ) => void;

    removeRow: (rowId: string) => void;
    setEditingComponent: (component: StructuredComponent) => void;
    clearEditingComponent: () => void;
    currentComponent: StructuredComponent | null;
    getComponent: (
        componentId: string
    ) => StructuredComponent | undefined;

    reorderComponents: ({ rowId, columnId, startIndex, endIndex }) => void;
    moveComponent: ({
        sourceRowId,
        sourceColumnId,
        destinationRowId,
        destinationColumnId,
        sourceIndex,
        destinationIndex,
    }) => void;
}

const DroppedComponentsContext = createContext<
    DroppedComponentsContextType | undefined
>(undefined);

export const DroppedComponentsProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { toggleSidebar, setOpen } = useSidebar();

    const [components, setComponents] = useState<StructuredRow[]>([]);
    const [currentComponent, setCurrentComponent] =
        useState<StructuredComponent | null>(null);

    const handleAddComponentToRow = useCallback(
        (
            destination: Destination, // Contains droppableId (row ID) and index
            childComponent: StructuredComponent
        ) => {
            if (!childComponent) {
                console.error('Child component is undefined or invalid');
                return;
            }

            setComponents((prev) =>
                prev.map((row) => {
                    if (row.id !== destination.droppableId) return row;

                    const updatedComponents = [...(row.children || [])];

                    updatedComponents.splice(
                        destination.index,
                        0,
                        childComponent
                    );
                    return {
                        ...row,
                        children: updatedComponents,
                    };
                })
            );
        },
        []
    );
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
                console.log(component);
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
            setComponents((prev) =>
                prev.map((row) => ({
                    ...row,
                    children: (row.children || []).map(updateComponentTree),
                }))
            );
        },
        []
    );

    //Funcao para fazer update de um component
    const updateComponent = (
        id: string,
        updatedComponent: StructuredComponent
    ) => {
        setComponents((prevComponents) =>
            prevComponents.map((row) => ({
                ...row,
                children: row.children.map((comp) =>
                    comp.id === id ? { ...comp, ...updatedComponent } : comp
                ),
            }))
        );
    };

    // Função que remove uma linha
    const removeRow = useCallback((rowId: string) => {
        setComponents((prevComponents) => {
            return prevComponents.filter((row) => row.id !== rowId);
        });
    }, []);

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
                // If the current component has children, search for the target ID
                if (component.children) {
                    // Filter out the child with the matching ID
                    const updatedChildren = component.children
                        .filter((child) => child.id !== destination.droppableId) // Remove the child with the matching ID
                        .map(updateComponentTree) // Recursively update the remaining children
                        .filter((child): child is StructuredComponent => child !== null); // Filter out null values
    
                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }
    
                // If no match is found, return the component unchanged
                return component;
            };
    
            // Update the components state
            setComponents((prev) =>
                prev
                    .map((row) => ({
                        ...row,
                        children: (row.children || [])
                            .map(updateComponentTree)
                            .filter((child): child is StructuredComponent => child !== null), // Filter out null values
                    }))
                    .filter((row) => row.children && row.children.length > 0) // Remove empty rows
            );
        },
        []
    );

    // Função que obtém componentes de uma coluna específica
    const getComponents = (
        rowId: string,
        columnId: string
    ): StructuredComponent[] => {
        const row = components.find((comp) => comp.id === rowId);
        if (!row) return [];
        const column = row.children.find((col) => col.id === columnId);
        return column && column.components ? column.components : [];
    };


    // Função que obtém todos os componentes
    const getAllComponents = (): StructuredRow[] => components;

    const setEditingComponent = (component: StructuredComponent) => {
        setCurrentComponent(component);
        toggleSidebar();
        setOpen(false);
    };

    const clearEditingComponent = () => {
        setCurrentComponent(null);
    };

    const getComponent = (
        componentId: string
    ): StructuredComponent | undefined => {
        const foundComponent = components
            .flatMap((row) => row.children)
            .flatMap((column) => column.components)
            .find((comp) => comp.id === componentId);

        return foundComponent;
    };

    const setInitComponents = (rows: StructuredRow[]) => {
        setComponents(rows);
    };

    const reorderComponents = ({ rowId, columnId, startIndex, endIndex }) => {
        setComponents((prevComponents) => {
            const updatedComponents = [...prevComponents];

            // Find the index of the row to update
            const rowIndex = updatedComponents.findIndex(
                (row) => row.id === rowId
            );

            console.log(rowId, rowIndex);

            // Make a copy of the row you want to reorder components in
            const updatedRow = { ...updatedComponents[rowIndex] };

            console.log(updatedRow);

            const columnIndex = updatedRow.children.findIndex(
                (col) => col.id === columnId
            );

            // Make a copy of the column to update its components
            const updatedColumn = { ...updatedRow.children[columnIndex] };

            // Ensure you're reordering the correct list of components inside the row
            const listToReorder: StructuredComponent[] = [
                ...updatedColumn.components,
            ]; // Assuming components are stored as an array inside the row object

            // Reorder the components within the column
            const reorderedList: StructuredComponent[] = reorder(
                listToReorder,
                startIndex,
                endIndex
            );
            console.log(reorderedList);

            // Update the column's components with the reordered list
            updatedColumn.components = reorderedList;

            // Replace the updated column back into the row's children array
            updatedRow.children[columnIndex] = updatedColumn;

            // Replace the updated row back into the array of components
            updatedComponents[rowIndex] = updatedRow;

            return updatedComponents;
        });
    };

    const moveComponent = ({
        sourceRowId,
        sourceColumnId,
        destinationRowId,
        destinationColumnId,
        sourceIndex,
        destinationIndex,
    }) => {
        setComponents((prevComponents) => {
            const updatedComponents = [...prevComponents];

            // Find the index of the source row
            const sourceRowIndex = updatedComponents.findIndex(
                (row) => row.id === sourceRowId
            );
            const sourceRow = { ...updatedComponents[sourceRowIndex] };

            console.log(sourceRow);
            if (!sourceRow.children) return updatedComponents;

            // Find the index of the source column within the source row
            const sourceColumnIndex = sourceRow.children.findIndex(
                (col) => col.id === sourceColumnId
            );
            const sourceColumn = { ...sourceRow.children[sourceColumnIndex] };

            console.log(sourceColumn);

            // Find the component to move
            const sourceComponent = sourceColumn.components[sourceIndex];

            console.log(sourceComponent);

            // Remove the component from the source column
            const updatedSourceComponents = [...sourceColumn.components];
            updatedSourceComponents.splice(sourceIndex, 1); // Remove the component
            sourceColumn.components = updatedSourceComponents;

            // Update the source row's column
            sourceRow.children[sourceColumnIndex] = sourceColumn;

            // Find the index of the destination row
            const destinationRowIndex = updatedComponents.findIndex(
                (row) => row.id === destinationRowId
            );
            const destinationRow = {
                ...updatedComponents[destinationRowIndex],
            };

            // Find the index of the destination column within the destination row
            const destinationColumnIndex = destinationRow.children.findIndex(
                (col) => col.id === destinationColumnId
            );
            const destinationColumn = {
                ...destinationRow.children[destinationColumnIndex],
            };

            // Insert the component into the destination column
            const updatedDestinationComponents = [
                ...destinationColumn.components,
            ];
            updatedDestinationComponents.splice(
                destinationIndex,
                0,
                sourceComponent
            ); // Add the component at the new index
            destinationColumn.components = updatedDestinationComponents;

            // Update the destination row's column
            destinationRow.children[destinationColumnIndex] = destinationColumn;

            // Update the updatedComponents array with the modified source and destination rows
            updatedComponents[sourceRowIndex] = sourceRow;
            updatedComponents[destinationRowIndex] = destinationRow;

            return updatedComponents;
        });
    };

    return (
        <DroppedComponentsContext.Provider
            value={{
                setInitComponents,
                handleAddComponentToRow,
                handleAddChildToComponent,
                handleRemoveChildFromComponent,
                updateComponent,
                getComponents,
                removeRow,
                getAllComponents,
                setEditingComponent,
                clearEditingComponent,
                currentComponent,
                getComponent,
                reorderComponents,
                moveComponent,
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
