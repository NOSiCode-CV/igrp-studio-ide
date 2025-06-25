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
    DroppedComponentsContextType,
    EditingComponentParams,
    StructuredComponent,
    StructuredLayout,
} from '@renderer/lib/dnd/types';
import {
    Arguments,
    CustomFunctionConfig,
    Import,
    State,
    TypeDef,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';

const DroppedComponentsContext = createContext<
    DroppedComponentsContextType | undefined
>(undefined);

export const DroppedComponentsProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { toggleSidebar, setOpen } = useSidebar();

    const [components, setComponents] = useState<StructuredComponent>({
        id: '',
        tag: '',
        componentName: '',
        label: '',
        type: '',
        properties: {},
        interactions: {},
        children: [],
    });

    const [types, setTypes] = useState<TypeDef[]>([]);

    const [functions, setFunctions] = useState<CustomFunctionConfig[]>([]);

    const [states, setStates] = useState<State[]>([]);

    const [imports, setImports] = useState<Import[]>([]);

    const [componentArguments, setComponentArguments] = useState<Arguments[]>(
        []
    );

    const [currentComponent, setCurrentComponent] =
        useState<EditingComponentParams | null>(null);

    const setAllComponents = (components: StructuredLayout) => {
        setComponents(components);
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
            setComponents((prev) => {
                const updatedRoot = updateComponentTree(prev);
                return updatedRoot;
            });
        },
        []
    );

    const handleReorderChildInComponent = useCallback(
        (
            _draggableId: string,
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

            let movedComponent: StructuredComponent | null = null;

            // Recursive function to find and remove the source component
            const removeComponentFromSource = (
                component: StructuredComponent
            ): StructuredComponent => {
                if (component.id === source.droppableId) {
                    const updatedChildren = [...(component.children || [])];
                    // Capture the moved component
                    [movedComponent] = updatedChildren.splice(source.index, 1);
                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }

                if (component.children) {
                    const updatedChildren = component.children.map(
                        removeComponentFromSource
                    );
                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }

                return component;
            };

            // Recursive function to insert the component into the destination
            const insertComponentIntoDestination = (
                component: StructuredComponent
            ): StructuredComponent => {
                if (component.id === destination.droppableId) {
                    const updatedChildren = [...(component.children || [])];
                    // Insert the moved component into the destination
                    if (movedComponent) {
                        updatedChildren.splice(
                            destination.index,
                            0,
                            movedComponent
                        );
                    }
                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }

                if (component.children) {
                    const updatedChildren = component.children.map(
                        insertComponentIntoDestination
                    );
                    return {
                        ...component,
                        children: updatedChildren,
                    };
                }

                return component;
            };

            // Update the components state
            setComponents((prev) => {
                // First, remove the component from the source
                const componentsAfterRemoval = removeComponentFromSource(prev);

                // Then, insert the component into the destination
                const updatedComponents = insertComponentIntoDestination(
                    componentsAfterRemoval
                );

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

            setCurrentComponent(null);
        },
        []
    );
    //Funcao para fazer update de um component
    const handleUpdateChildComponent = useCallback(
        (componentId: string, updates: Partial<StructuredComponent>) => {
            if (!componentId || !updates) {
                console.error('Invalid component ID or updates');
                return;
            }

            setComponents((prev) => {
                // First check if we're updating the root component
                if (prev.id === componentId) {
                    return {
                        ...prev,
                        ...updates,
                    };
                }

                // Recursive function to find and update child components
                const updateComponentTree = (
                    component: StructuredComponent
                ): StructuredComponent => {
                    if (component.id === componentId) {
                        return {
                            ...component,
                            ...updates,
                        };
                    }

                    if (component.children) {
                        const updatedChildren =
                            component.children.map(updateComponentTree);
                        return {
                            ...component,
                            children: updatedChildren,
                        };
                    }

                    return component;
                };

                return {
                    ...prev,
                    children: (prev.children || []).map(updateComponentTree),
                };
            });
        },
        []
    );

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

    const setEditingComponent = ({
        path,
        component,
    }: EditingComponentParams) => {
        setCurrentComponent({ path, component });
        toggleSidebar();
        setOpen(false);
    };

    const clearEditingComponent = () => {
        setCurrentComponent(null);
    };

    //types
    const addType = (type: TypeDef) => {
        setTypes((prev) => [...prev, type]);
    };

    const updateType = (id: string, updates: Partial<TypeDef>) => {
        setTypes((prev) =>
            prev.map((type) =>
                type.componentId === id ? { ...type, ...updates } : type
            )
        );
    };

    const removeType = (id: string) => {
        setTypes((prev) => prev.filter((type) => type.componentId !== id));
    };

    const createOrUpdateType = (newType: TypeDef) => {
        setTypes((prevTypes) => {
            const existingIndex = prevTypes.findIndex(
                (t) => t.componentId === newType.componentId
            );

            if (existingIndex !== -1) {
                // Update
                const updated = [...prevTypes];
                updated[existingIndex] = newType;
                return updated;
            } else {
                // Create
                return [...prevTypes, newType];
            }
        });
    };

    const getTypeByComponentId = (componentId: string): TypeDef | undefined => {
        return types.find((t) => t.componentId === componentId);
    };

    const setAllTypes = (newTypes: TypeDef[]) => {
        setTypes(newTypes);
    };

    //functions
    const addFunction = (fnc: CustomFunctionConfig) => {
        setFunctions((prev = []) => [...prev, fnc]); // Fallback to empty array
    };

    const updateFunction = (
        id: string,
        updates: Partial<CustomFunctionConfig>
    ) => {
        setFunctions((prev) =>
            prev.map((fnc) => (fnc.id === id ? { ...fnc, ...updates } : fnc))
        );
    };

    const removeFunction = (id: string) => {
        setFunctions((prev) => prev.filter((fnc) => fnc.id !== id));
    };

    const setAllFunctions = (fncs: CustomFunctionConfig[]) => {
        setFunctions(Array.isArray(fncs) ? fncs : []); // Ensure array
    };

    //states
    const addState = (state: State) => {
        setStates((prev = []) => [...prev, state]); // Fallback to empty array
    };

    const updateState = (id: string, updates: Partial<State>) => {
        setStates((prev) =>
            prev.map((state) =>
                state.id === id ? { ...state, ...updates } : state
            )
        );
    };

    const removeState = (id: string) => {
        setStates((prev) => prev.filter((state) => state.id !== id));
    };

    const setAllStates = (states: State[]) => {
        setStates(Array.isArray(states) ? states : []);
    };

    //imports
    const addImport = (importPath: Import) => {
        setImports((prev = []) => [...prev, importPath]); // Fallback to empty array
    };

    const updateImport = (id: string, updates: Partial<Import>) => {
        setImports((prev) =>
            prev.map((importPath) =>
                importPath.id === id
                    ? { ...importPath, ...updates }
                    : importPath
            )
        );
    };
    const removeImport = (id: string) => {
        setImports((prev) => prev.filter((importPath) => importPath.id !== id));
    };
    const setAllImports = (imports: Import[]) => {
        setImports(Array.isArray(imports) ? imports : []); // Ensure array
    };

    const setAllArguments = (args: Arguments[]) => {
        setComponentArguments(Array.isArray(args) ? args : []);
    };

    return (
        <DroppedComponentsContext.Provider
            value={{
                setAllComponents,
                handleAddChildToComponent,
                handleRemoveChildFromComponent,
                handleReorderChildInComponent,
                handleUpdateChildComponent,
                removeRow,
                setEditingComponent,
                clearEditingComponent,

                addType,
                updateType,
                removeType,
                createOrUpdateType,
                getTypeByComponentId,
                setAllTypes,

                addFunction,
                updateFunction,
                removeFunction,
                setAllFunctions,

                addState,
                updateState,
                removeState,
                setAllStates,

                addImport,
                updateImport,
                removeImport,
                setAllImports,

                components,
                currentComponent,
                types,
                functions,
                states,
                imports,

                setAllArguments,
                componentArguments
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
