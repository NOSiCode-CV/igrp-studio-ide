import React, { useEffect, useState } from 'react';
import RowOptions from '../tools/RowOptions';
import { ColProps } from '../components/Grid';
import { generateId } from '@renderer/utils/helpers';
import { cn } from '@renderer/lib/utils';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import useStudio from '@renderer/hooks/useStudio';
import BoxContainer from '../BoxContainer';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';

interface RowContainerProps {
    id: string;
    components: ComponentData[];
    onClickAddControl: (id: string, type: string) => void;
    onClickDeleteSection: (id: string) => void;
}

const RowContainer: React.FC<RowContainerProps> = ({
    id,
    components,
    onClickAddControl,
    onClickDeleteSection,
}) => {

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { dynamicImport } = useStudio();

    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            for (const comp of components) {
                const component = await dynamicImport(comp.componentName);
                comps[comp.id] = component;
            }

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [components, dynamicImport]);

    const handleClickStructure = (layout: string) => {
        const newLayout = layout
            .split(',')
            .map((size) => parseInt(size.trim(), 10));
        const currentRow: HierarchicalComponent[] = getRow(id); // Pega o primeiro elemento, pois `getRow` retorna um array
        const currentColumns = currentRow ? currentRow[0].columns : [];

        // Get current column sizes
        const currentSizes = currentColumns.map((col) =>
            parseInt(col.colSize.toString())
        );

        // Add new columns or update existing columns
        newLayout.forEach((colSize, index) => {
            if (index < currentSizes.length) {
                // if column exists, update size and move components
                const currentCol = currentColumns[index];
                const props = { ...currentCol, colSize: colSize.toString() };

                // move components from current column to new one
                if (currentCol.components.length > 0) {
                    props.components = [...currentCol.components];
                }

                const data: ColProps = {
                    rowId: id,
                    columnId: props.id,
                    colSize,
                };

                // update the column existing
                addDroppedComponent({ data, props: props });
            } else {
                // Create  a new column if does not exist
                const data: ColProps = {
                    rowId: id,
                    columnId: generateId('col'),
                    colSize,
                };
                addDroppedComponent({
                    data,
                    props: { size: colSize.toString() },
                });
            }
        });

        // Remove extra column
        if (newLayout.length < currentSizes.length) {
            const columnsToRemove = currentSizes.length - newLayout.length;
            for (let i = 0; i < columnsToRemove; i++) {
                removeColumn(currentColumns[newLayout.length + i].id);
            }
        }
    };

    const handleClickAddControl = (type: string) => {
        onClickAddControl(id, type);
    };

    return (
        <div className="group/row relative hover:border-2 hover:border-igrp hover:rounded-sm bg-white p-3">
            <RowOptions
                onClickAddControl={handleClickAddControl}
                onClickStructure={handleClickStructure}
                onClickDeleteSection={() => onClickDeleteSection(id)}
            />
            <Droppable droppableId={id}>
                {(provided: any, snapshot: any) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            'grid gap-3',
                            snapshot.isDraggingOver
                                ? 'border-2 border-dashed border-igrp p-2 '
                                : ''
                        )}
                    >
                        {components.length > 0
                            ? components.map(
                                  (comp: DroppedComponent, index: number) => {
                                      const Component =
                                          loadedComponents[comp.id];

                                      return Component ? (
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
                                                      <BoxContainer
                                                          key={comp.id}
                                                          id={comp.id}
                                                          group="components"
                                                          onEdit={
                                                              () =>
                                                                  console.log()
                                                              /*  handleEditClick(
                                                                  comp
                                                              ) */
                                                          }
                                                          dragHandleProps={
                                                              provided.dragHandleProps
                                                          }
                                                          className={"left-0 top-0 right-auto"}
                                                      >
                                                          <Component
                                                              comp={comp}
                                                              componentId={
                                                                  comp.id
                                                              }
                                                          />
                                                      </BoxContainer>
                                                  </div>
                                              )}
                                          </Draggable>
                                      ) : (
                                          <div key={comp.id}>Loading...</div>
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

export default RowContainer;
