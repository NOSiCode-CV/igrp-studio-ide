import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import BoxContainer from '../BoxContainer';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { DroppedComponent } from '@renderer/generators/ui/interfaces';
import { COMPONENT } from '@renderer/generators/ui/ComponentTypes';
import { GenNoInfoComp } from '@renderer/generators/ui/components/GenNoInfoComp';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/useStudio';

export interface ColProps {
    rowId: string;
    columnId: string;
    colSize: number;
}

const ColContainer: React.FC<ColProps> = ({ rowId, columnId, colSize }) => {
    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});
    const { getComponents, setEditingComponent } = useDroppedComponents();

    const { dynamicImport } = useStudio();

    const components: DroppedComponent[] = getComponents(rowId, columnId);

    const handleEditClick = (component: Partial<DroppedComponent>) => {
        setEditingComponent(component);
    };

    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            // Load form fields
            for (const comp of components) {
                console.log(comp.componentName);
                const component = await dynamicImport(comp.componentName);
                components[comp.id] = component;
                console.log(components[comp.id]);
            }

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [components, dynamicImport]);

    return (
        <div
            className={cn(`bg-muted/70 rounded-lg p-2 col-span-${colSize}`)}
            id={columnId}
        >
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
                                      const Component =
                                          loadedComponents[comp.id];

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
                                                      {Component && (
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
                                                              <Component
                                                                  comp={comp}
                                                                  componentId={
                                                                      comp.id
                                                                  }
                                                                  onEdit={() =>
                                                                      handleEditClick(
                                                                          comp
                                                                      )
                                                                  }
                                                              />
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
