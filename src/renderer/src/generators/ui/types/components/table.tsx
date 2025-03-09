import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import useStudio from '@renderer/hooks/useStudio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import { layoutMapping } from '../../utils/layout-mapping';
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
import RowTools from '../tools/RowTools';
import { cn } from '@renderer/lib/utils';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Button } from '@renderer/components/ui/button';
import { ChevronRight } from 'lucide-react';

export interface TableProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const TableComp: React.FC<TableProps> = ({ comp, onDragEnd }: TableProps) => {
    const { children, properties, componentName, id: componentId } = comp;

    const { variant, className } = properties || {};

    const buttonChildren = children.filter(
        (child) => child.componentName === 'button'
    );
    const nonButtonChildren = children.filter(
        (child) => child.componentName !== 'button'
    );

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

            for (const comp of children) {
                const component = await dynamicImport(comp.componentName);
                comps[comp.id] = component;
            }

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [children, dynamicImport]);

    // Function to generate fake data for the table
    const generateFakeData = () => {
        return Array.from({ length: 4 }).map(() => {
            const rowData: { [key: string]: any } = {};
            children.forEach((child) => {
                rowData[child.id] = generateFakeDataForField(child);
            });
            return rowData;
        });
    };

    const fakeData = generateFakeData();

    const renderChildren = () => {
        return nonButtonChildren.map(
            (comp: StructuredComponent, index: number) => {
                const Component = loadedComponents[comp.id];
                const { properties, componentName } = comp;

                const { variant, className } = properties || {};

                let baseClass = className;
                if (
                    layoutMapping[componentName] &&
                    layoutMapping[componentName][variant] &&
                    variant !== 'custom'
                ) {
                    baseClass = layoutMapping[componentName][variant];
                }

                return (
                    Component && (
                        <TableHead key={comp.id}>
                            <Draggable
                                item={comp}
                                index={index}
                                mode="MOVE"
                                layout="horizontal"
                                dropTargetId={componentId}
                                className={cn(
                                    baseClass,
                                    'relative group border-none'
                                )}
                            >
                                <span>{componentName}</span>
                                <div className="absolute top-0 text-center mt-1 px-2 py-1 bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                                    <RowTools
                                        id={comp.id}
                                        onEdit={() => handleEditClick(comp)}
                                        index={index}
                                    />
                                </div>
                            </Draggable>
                        </TableHead>
                    )
                );
            }
        );
    };

    let baseClass = className;
    if (
        layoutMapping[componentName] &&
        layoutMapping[componentName][variant] &&
        variant !== 'custom'
    ) {
        baseClass = layoutMapping[componentName][variant];
    }

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            className="border-none p-0"
        >
            <Table>
                <TableHeader>
                    <TableRow>{renderChildren()}</TableRow>
                    {/* Add a single header for all buttons */}
                    {buttonChildren.length > 0 && (
                        <TableHead>Actions</TableHead>
                    )}
                </TableHeader>
                <TableBody>
                    {fakeData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {nonButtonChildren.map((child) => (
                                <TableCell key={child.id}>
                                    {child.componentName === 'checkbox' ? (
                                        <Checkbox
                                            id={child.id}
                                            checked={row[child.id]}
                                            onCheckedChange={(checked) => {
                                                // Handle checkbox state change if needed
                                                console.log(
                                                    `Checkbox ${child.id} changed to:`,
                                                    checked
                                                );
                                            }}
                                        />
                                    ) : (
                                        row[child.id]
                                    )}
                                </TableCell>
                            ))}
                            {/* Render all buttons in a single cell */}
                            {buttonChildren.length > 0 && (
                                <TableCell>
                                    <div className="flex flex-1 space-x-1">
                                        {buttonChildren.map((child) => (
                                            <Button
                                                key={child.id}
                                                variant="outline"
                                                size={'icon'}
                                                onClick={() => {
                                                    // Handle button click
                                                    console.log(
                                                        `Button ${child.id} clicked`
                                                    );
                                                }}
                                                className="ml-auto"
                                            >
                                                    <ChevronRight />
                                            </Button>
                                        ))}
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Droppable>
    );
};

export default TableComp;
