import React from 'react';
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import { DroppedComponent } from '@renderer/pages/uiBuilder/interfaces';
import BoxContainer from '../BoxContainer';
import ModalEdition from '@renderer/pages/uiBuilder/components/EditComponent/ModalEdition';
import { AcceptTypesRegistry, ComponentRegistry } from '@renderer/pages/uiBuilder/data/ComponentRegistry';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { COMPONENT } from '@renderer/utils/ComponentTypes';

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
                <div className='gen-column-inner gen-inner'>
                    <Droppable droppableId={`${rowId}-${columnId}`}
                        colSize={colSize}
                        type={COMPONENT}
                    >
                        {(provided: any, snapshot: any) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className='gen-container-placeholder'
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
            </div>
        </React.Fragment>
    );
};

export default ColContainer;
