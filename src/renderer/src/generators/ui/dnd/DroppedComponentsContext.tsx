import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
} from 'react';
import { Column, DroppedComponent, HierarchicalComponent } from '../interfaces';
import { ColProps } from '../types/rows/ColContainer';
import { reorder } from './helpers';

export interface ComponentProps {
    data: ColProps;
    componentId?: string | null;
    props?: Object;
    index?: number;
}

interface DroppedComponentsContextType {
    setInitComponents: (components: HierarchicalComponent[]) => void;
    getAllComponents: () => HierarchicalComponent[];
    getComponents: (rowId: string, columnId: string) => DroppedComponent[];
    getRow: (rowId: string) => HierarchicalComponent[];
    addDroppedComponent: (props: ComponentProps) => void;
    updateComponent: (
        id: string,
        updatedComponent: Partial<DroppedComponent>
    ) => void;
    removeRow: (rowId: string) => void;
    getComponentsByRow: (rowId: string) => Column[];
    setEditingComponent: (component: Partial<DroppedComponent>) => void;
    clearEditingComponent: () => void;
    currentComponent: Partial<DroppedComponent> | null;
    getComponent: (
        componentId: string
    ) => Partial<DroppedComponent> | undefined;
    removeColumn: (columnId: string) => void;
    removeComponent: (componentId: string) => void;
    removeComponentField: (fieldId: string) => void;
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
    const [components, setComponents] = useState<HierarchicalComponent[]>([]);
    const [currentComponent, setCurrentComponent] =
        useState<Partial<DroppedComponent> | null>(null);

    // Função que adiciona componentes na coluna correta
    const addDroppedComponent = useCallback(
        ({ data, index, componentId, props }: ComponentProps) => {
            const newComponent: DroppedComponent | null = componentId
                ? {
                      id: componentId,
                      ...props,
                  }
                : null;

            setComponents((prevComponents) => {
                const updatedComponents = [...prevComponents];

                // Verificar se a linha já existe (rowId)
                const rowIndex = updatedComponents.findIndex(
                    (row) => row.id === data.rowId
                );

                if (rowIndex === -1) {
                    // Se a linha não existir, cria uma nova linha com uma coluna
                    return [
                        ...updatedComponents,
                        {
                            id: data.rowId,
                            columns: [
                                {
                                    id: data.columnId,
                                    colSize: data.colSize,
                                    components: newComponent
                                        ? [newComponent]
                                        : [], // Se não houver componente, cria array vazio
                                },
                            ],
                        },
                    ];
                }

                const updatedRow = { ...updatedComponents[rowIndex] };

                // Verificar se a coluna já existe na linha
                const columnIndex = updatedRow.columns.findIndex(
                    (col) => col.id === data.columnId
                );

                if (columnIndex === -1) {
                    // Se a coluna não existir, adicionar uma nova coluna com array de componentes vazio ou com o novo componente
                    updatedRow.columns = [
                        ...updatedRow.columns,
                        {
                            id: data.columnId,
                            colSize: data.colSize,
                            components: newComponent ? [newComponent] : [],
                        },
                    ];
                } else {
                    // Update existing column
                    const updatedColumn = {
                        ...updatedRow.columns[columnIndex],
                    };

                    if (newComponent) {
                        const insertIndex =
                            typeof index === 'number'
                                ? index
                                : updatedColumn.components.length;

                        // Check if a component with the same ID already exists
                        const existingComponentIndex =
                            updatedColumn.components.findIndex(
                                (comp) => comp.id === newComponent.id
                            );

                        if (existingComponentIndex !== -1) {
                            // If the component exists, update it
                            updatedColumn.components[existingComponentIndex] = {
                                ...updatedColumn.components[
                                    existingComponentIndex
                                ],
                                ...newComponent, // Merge existing props with new props
                            };
                        } else if (updatedColumn.components.length > 0) {
                            // If the component doesn't exist and there are existing components, insert it
                            updatedColumn.components = [
                                ...updatedColumn.components.slice(
                                    0,
                                    insertIndex
                                ),
                                newComponent,
                                ...updatedColumn.components.slice(insertIndex),
                            ];
                        } else {
                            // If no components exist, add the new component as the first element
                            updatedColumn.components = [newComponent];
                        }
                    } else {
                        // Update colSize if no new component is provided
                        updatedColumn.colSize = data.colSize;
                    }

                    updatedRow.columns[columnIndex] = updatedColumn;
                }

                // Atualizar a linha no array de componentes and size row
                updatedComponents[rowIndex] = {
                    ...updatedRow,
                };

                return updatedComponents;
            });
        },
        []
    );

    //Funcao para fazer update de um component
    const updateComponent = (
        id: string,
        updatedComponent: Partial<DroppedComponent>
    ) => {
        setComponents((prevComponents) =>
            prevComponents.map((row) => ({
                ...row,
                columns: row.columns.map((column) => ({
                    ...column,
                    components: column.components.map((comp) =>
                        comp.id === id ? { ...comp, ...updatedComponent } : comp
                    ),
                })),
            }))
        );
    };

    // Função que remove uma linha
    const removeRow = useCallback((rowId: string) => {
        setComponents((prevComponents) => {
            return prevComponents.filter((row) => row.id !== rowId);
        });
    }, []);

    // Função que remove uma linha
    const removeColumn = useCallback((columnId: string) => {
        setComponents((prevComponents) => {
            return prevComponents.map((row) => {
                return {
                    ...row,
                    columns: row.columns.filter((col) => col.id !== columnId),
                };
            });
        });
    }, []);

    // Função que remove uma components
    const removeComponent = useCallback((componentId: string) => {
        setComponents((prevComponents) => {
            return prevComponents.map((row) => {
                return {
                    ...row,
                    columns: row.columns.map((column) => ({
                        ...column,
                        components: column.components.filter(
                            (comp) => comp.id !== componentId
                        ),
                    })),
                };
            });
        });
    }, []);

    // Função que remove uma components
    const removeComponentField = useCallback((fieldId: string) => {
        setComponents((prevComponents) => {
            return prevComponents.map((row) => {
                return {
                    ...row,
                    columns: row.columns.map((column) => ({
                        ...column,
                        components: column.components.map((comp) => ({
                            ...comp,
                            fields: comp.fields
                                ? comp.fields.filter(
                                      (field) => field.id !== fieldId
                                  )
                                : comp.fields,
                        })),
                    })),
                };
            });
        });
    }, []);

    // Função que obtém componentes de uma coluna específica
    const getComponents = (
        rowId: string,
        columnId: string
    ): DroppedComponent[] => {
        const row = components.find((comp) => comp.id === rowId);
        if (!row) return [];
        const column = row.columns.find((col) => col.id === columnId);
        return column && column.components ? column.components : [];
    };

    // Função que obtém todos os componentes de uma linha específica
    const getComponentsByRow = (rowId: string): Column[] => {
        const row = components.filter((comp) => comp.id === rowId);
        if (row.length > 0) return row[0].columns;
        return [];
    };

    const getRow = (rowId: string): HierarchicalComponent[] => {
        return components.filter((comp) => comp.id === rowId);
    };

    // Função que obtém todos os componentes
    const getAllComponents = (): HierarchicalComponent[] => components;

    const setEditingComponent = (component: Partial<DroppedComponent>) => {
        setCurrentComponent(component);
    };

    const clearEditingComponent = () => {
        setCurrentComponent(null);
    };

    const getComponent = (
        componentId: string
    ): DroppedComponent | undefined => {
        const foundComponent = components
            .flatMap((row) => row.columns)
            .flatMap((column) => column.components)
            .find((comp) => comp.id === componentId);

        return foundComponent;
    };

    const setInitComponents = (components: HierarchicalComponent[]) => {
        setComponents(components);
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

            const columnIndex = updatedRow.columns.findIndex(
                (col) => col.id === columnId
            );

            // Make a copy of the column to update its components
            const updatedColumn = { ...updatedRow.columns[columnIndex] };

            // Ensure you're reordering the correct list of components inside the row
            const listToReorder: DroppedComponent[] = [
                ...updatedColumn.components,
            ]; // Assuming components are stored as an array inside the row object

            // Reorder the components within the column
            const reorderedList: DroppedComponent[] = reorder(
                listToReorder,
                startIndex,
                endIndex
            );
            console.log(reorderedList);

            // Update the column's components with the reordered list
            updatedColumn.components = reorderedList;

            // Replace the updated column back into the row's columns array
            updatedRow.columns[columnIndex] = updatedColumn;

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
            if (!sourceRow.columns) return updatedComponents;

            // Find the index of the source column within the source row
            const sourceColumnIndex = sourceRow.columns.findIndex(
                (col) => col.id === sourceColumnId
            );
            const sourceColumn = { ...sourceRow.columns[sourceColumnIndex] };

            console.log(sourceColumn);

            // Find the component to move
            const sourceComponent = sourceColumn.components[sourceIndex];

            console.log(sourceComponent);

            // Remove the component from the source column
            const updatedSourceComponents = [...sourceColumn.components];
            updatedSourceComponents.splice(sourceIndex, 1); // Remove the component
            sourceColumn.components = updatedSourceComponents;

            // Update the source row's column
            sourceRow.columns[sourceColumnIndex] = sourceColumn;

            // Find the index of the destination row
            const destinationRowIndex = updatedComponents.findIndex(
                (row) => row.id === destinationRowId
            );
            const destinationRow = {
                ...updatedComponents[destinationRowIndex],
            };

            // Find the index of the destination column within the destination row
            const destinationColumnIndex = destinationRow.columns.findIndex(
                (col) => col.id === destinationColumnId
            );
            const destinationColumn = {
                ...destinationRow.columns[destinationColumnIndex],
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
            destinationRow.columns[destinationColumnIndex] = destinationColumn;

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
                addDroppedComponent,
                updateComponent,
                getRow,
                getComponents,
                removeRow,
                getAllComponents,
                getComponentsByRow,
                setEditingComponent,
                clearEditingComponent,
                currentComponent,
                getComponent,
                removeComponent,
                removeColumn,
                removeComponentField,
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
