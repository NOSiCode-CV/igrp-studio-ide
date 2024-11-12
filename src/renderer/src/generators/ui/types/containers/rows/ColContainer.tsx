import React from 'react';
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import BoxContainer from '../BoxContainer';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { DroppedComponent } from '@renderer/generators/ui/interfaces';
import ModalEdition from '@renderer/generators/ui/components/EditComponent/ModalEdition';
import { COMPONENT } from '@renderer/generators/ui/ComponentTypes';
import { AcceptTypesRegistry, ComponentRegistry } from '@renderer/generators/ui/data/ComponentRegistry';

export interface ColProps {
    rowId: string;
    columnId: string;
    colSize: number;
}

const getListStyle = isDraggingOver => ({
    border: isDraggingOver ? '2px dashed blue' : 'none',
});

const ColContainer: React.FC<ColProps> = ({ rowId, columnId, colSize }) => {
    const { getComponents, setEditingComponent, currentComponent } = useDroppedComponents();
    const components: DroppedComponent[] = getComponents(rowId, columnId);

    const handleEditClick = (component: Partial<DroppedComponent>) => {
        setEditingComponent(component);
    };

    const isEmpty = components.length === 0;

    return (

        <React.Fragment>
            {currentComponent &&
                <ModalEdition
                    show={currentComponent !== null}
                />
            }

            <div
                className={`gen-column col-md-${colSize}`}
                data-empty={isEmpty ? 'true' : 'false'}
                id={columnId}
            >
                <Droppable droppableId={`${rowId}-${columnId}`}
                    colSize={colSize}
                    type={COMPONENT}
                >
                    {(provided: any, snapshot: any) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className='gen-container-placeholder space-y-4'
                            style={getListStyle(snapshot.isDraggingOver)}
                        >
                            {components ? components.map((comp: DroppedComponent, index: number) => {
                                const component = ComponentRegistry[comp.componentName];
                                return (

                                    <Draggable
                                        key={comp.id}
                                        draggableId={comp.id}
                                        index={index}
                                    >
                                        {(provided: any) => (
                                            <div key={comp.id}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                            >

                                                {component && (
                                                    <BoxContainer key={comp.id}
                                                        id={comp.id} tag={comp.id}
                                                        onEdit={() => handleEditClick(comp)}
                                                        dragHandleProps={provided.dragHandleProps}
                                                    >
                                                        {React.createElement(component, {
                                                            comp,
                                                            acceptTypes: AcceptTypesRegistry[comp.componentName],
                                                            componentId: comp.id,
                                                            onEdit: () => handleEditClick(comp),
                                                        })}
                                                    </BoxContainer>
                                                )}
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            }) : !provided.placeholder && (
                                <p>
                                    Drop items here
                                </p>
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </React.Fragment>
    );
};

export default ColContainer;
