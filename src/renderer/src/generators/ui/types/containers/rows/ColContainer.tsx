import React from 'react';
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import BoxContainer from '../BoxContainer';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { DroppedComponent } from '@renderer/generators/ui/interfaces';
import { COMPONENT } from '@renderer/generators/ui/ComponentTypes';
import {
    AcceptTypesRegistry,
    ComponentRegistry,
} from '@renderer/generators/ui/data/ComponentRegistry';
import { GenNoInfoComp } from '@renderer/generators/ui/components/GenNoInfoComp';
import { cn } from '@renderer/lib/utils';

export interface ColProps {
    rowId: string;
    columnId: string;
    colSize: number;
}

const ColContainer: React.FC<ColProps> = ({ rowId, columnId, colSize }) => {
    const { getComponents, setEditingComponent } = useDroppedComponents();
    const components: DroppedComponent[] = getComponents(rowId, columnId);

    const handleEditClick = (component: Partial<DroppedComponent>) => {
        setEditingComponent(component);
    };

    return (
        <div className={cn(`bg-muted/70 rounded-lg p-2 col-span-${colSize}`)} id={columnId}>
            <Droppable droppableId={`${rowId}-${columnId}`} type={COMPONENT}>
                {(provided: any, snapshot: any) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            'grid gap-4',
                            snapshot.isDraggingOver
                                ? 'border-2 border-dashed border-igrp p-2'
                                : ''
                        )}
                    >
                        {components.length > 0
                            ? components.map(
                                  (comp: DroppedComponent, index: number) => {
                                      const component =
                                          ComponentRegistry[comp.componentName];
                                      return (
                                          <Draggable
                                              key={comp.id}
                                              draggableId={comp.id}
                                              index={index}
                                          >
                                              {(provided: any) => (
                                                  <div
                                                      key={comp.id}
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                  >
                                                      {component && (
                                                          <BoxContainer
                                                              key={comp.id}
                                                              id={comp.id}
                                                              tag={comp.id}
                                                              onEdit={() =>
                                                                  handleEditClick(
                                                                      comp
                                                                  )
                                                              }
                                                              dragHandleProps={
                                                                  provided.dragHandleProps
                                                              }
                                                          >
                                                              {React.createElement(
                                                                  component,
                                                                  {
                                                                      comp,
                                                                      acceptTypes:
                                                                          AcceptTypesRegistry[
                                                                              comp
                                                                                  .componentName
                                                                          ],
                                                                      componentId:
                                                                          comp.id,
                                                                      onEdit: () =>
                                                                          handleEditClick(
                                                                              comp
                                                                          ),
                                                                  }
                                                              )}
                                                          </BoxContainer>
                                                      )}
                                                  </div>
                                              )}
                                          </Draggable>
                                      );
                                  }
                              )
                            : !snapshot.isDraggingOver && <GenNoInfoComp />}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default ColContainer;
