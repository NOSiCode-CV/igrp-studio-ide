import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import useStudio from '@renderer/hooks/useStudio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import Droppable from '@renderer/lib/dnd/Droppable';
import { generateFakeDataForField } from '@renderer/utils/helpers';
import RowTools from '../tools/FieldTools';
import { cn } from '@renderer/lib/utils';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { COMPONENT } from '../../ComponentTypes';
import { Button } from '@renderer/components/ui/button';
import { Ellipsis, Pointer } from 'lucide-react';
import BoxField from '../tools/BoxFields';

export interface TableProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const TableComp: React.FC<TableProps> = ({ comp, onDragEnd }: TableProps) => {
    const { children: components, id: componentId } = comp;

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { setEditingComponent } = useDroppedComponents();

    const { dynamicImport } = useStudio();

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent(component);
    };

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

    // Function to generate fake data for the table
    const generateFakeData = () => {
        return Array.from({ length: 4 }).map(() => {
            const rowData: { [key: string]: any } = {};
            components.forEach((child) => {
                rowData[child.id] = generateFakeDataForField(child);
            });
            return rowData;
        });
    };

    const fakeData = generateFakeData();

    const renderChildren = () => {
        return components.map((comp: StructuredComponent, index: number) => {
            const Component = loadedComponents[comp.id];
            const { componentName } = comp;

            return (
                Component && (
                    <TableHead key={comp.id}>
                        <Draggable
                            item={comp}
                            index={index}
                            mode="MOVE"
                            layout="horizontal"
                            dropTargetId={componentId}
                            className={cn('border-none')}
                        >
                            <BoxField
                                index={index}
                                comp={comp}
                                onEdit={() => handleEditClick(comp)}
                            >
                                <span>{componentName}</span>
                            </BoxField>
                        </Draggable>
                    </TableHead>
                )
            );
        });
    };

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            className="border-none p-0"
        >
            <Table>
                <TableHeader>
                    <TableRow>{renderChildren()}</TableRow>
                </TableHeader>
                <TableBody>
                    {components.length > 0 ? (
                        fakeData.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {components.map((child) => (
                                    <TableCell key={child.id}>
                                        {child.componentName ===
                                        COMPONENT.Checkbox ? (
                                            <Checkbox
                                                id={child.id}
                                                checked={row[child.id]}
                                            />
                                        ) : child.componentName ===
                                          COMPONENT.Dropdown ? (
                                            <Button
                                                variant={'ghost'}
                                                size={'icon'}
                                            >
                                                <Ellipsis />
                                            </Button>
                                        ) : child.componentName ===
                                          COMPONENT.Button ? (
                                            <Button
                                                variant={'secondary'}
                                                size={'icon'}
                                            >
                                                <Pointer />
                                            </Button>
                                        ) : (
                                            row[child.id]
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <GenNoInfoComp />
                    )}
                </TableBody>
            </Table>
        </Droppable>
    );
};

export default TableComp;
