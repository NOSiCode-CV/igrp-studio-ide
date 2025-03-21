import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { generateFakeDataForField, getLabel } from '@renderer/utils/helpers';
import { cn } from '@renderer/lib/utils';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { COMPONENT } from '../../ComponentTypes';
import { Button } from '@renderer/components/ui/button';
import { Ellipsis } from 'lucide-react';
import BoxField from '../tools/BoxFields';
import { DropdownItem } from './dropdownitem';
import TableTool from '../tools/tableTool';

export interface TableProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const TableComp: React.FC<TableProps> = ({ comp, onDragEnd }) => {
    const { children: components, id: componentId, componentName } = comp;
    const [columns, setColumns] = useState<StructuredComponent[]>([]);
    const [filters, setFilters] = useState<StructuredComponent[]>([]);
    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});
    const { setEditingComponent } = useDroppedComponents();
    const { dynamicImport } = useStudio();

    // Extract table columns and filters from components
    useEffect(() => {
        const tableColumn = components.find(
            (comp) => comp.componentName === COMPONENT.TableColumn
        );
        const tableFilter = components.find(
            (comp) => comp.componentName === COMPONENT.TableFilter
        );
        setColumns(tableColumn?.children || []);
        setFilters(tableFilter?.children || []);
    }, [components]);

    // Load components dynamically
    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            const loadComponent = async (comp: StructuredComponent) => {
                try {
                    const component = await dynamicImport(comp.componentName);
                    comps[comp.id] = component;
                } catch (error) {
                    console.error(
                        `Failed to load component ${comp.componentName}:`,
                        error
                    );
                }
            };

            await Promise.all([
                ...columns.map(loadComponent),
                ...filters.map(loadComponent),
            ]);
            setLoadedComponents(comps);
        };

        loadComponents();
    }, [columns, filters, dynamicImport]);

    // Generate fake data for the table
    const fakeData = useMemo(() => {
        return Array.from({ length: 4 }).map(() => {
            const rowData: { [key: string]: any } = {};
            columns.forEach((child) => {
                rowData[child.id] = generateFakeDataForField(child);
            });
            return rowData;
        });
    }, [columns]);

    // Handle edit click
    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component });
        },
        [comp, setEditingComponent]
    );

    // Render table headers
    const renderTableHeaders = useCallback(
        (compName: string) => {
            return columns.map((child, index) => {
                const Component = loadedComponents[child.id];
                const { label, properties } = child;
                const { headerTitle } = properties || {};

                // Construct the path for tracking origin
                const path = `${componentName}/${compName}`;

                return Component ? (
                    <TableHead key={child.id}>
                        <Draggable
                            item={child}
                            index={index}
                            mode="MOVE"
                            layout="horizontal"
                            dropTargetId={componentId}
                            className={cn('border-none')}
                        >
                            <BoxField
                                index={index}
                                parentComp={comp}
                                comp={child}
                                path={path}
                                onEdit={() => handleEdit(child, path)}
                            >
                                <span>{headerTitle || label}</span>
                            </BoxField>
                        </Draggable>
                    </TableHead>
                ) : null;
            });
        },
        [columns, loadedComponents, componentId, comp, handleEdit]
    );

    // Render table rows
    const renderTableRows = useMemo(() => {
        return fakeData.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
                {columns.map((child) => (
                    <TableCell key={child.id}>
                        {child.componentName === COMPONENT.Checkbox ? (
                            <Checkbox id={child.id} checked={row[child.id]} />
                        ) : child.componentName === COMPONENT.Dropdown ? (
                            <DropdownItem comp={child} />
                        ) : child.componentName ===
                          COMPONENT.TableActionListCell ? (
                            <Button variant="secondary" size="icon">
                                <Ellipsis />
                            </Button>
                        ) : (
                            row[child.id]
                        )}
                    </TableCell>
                ))}
            </TableRow>
        ));
    }, [columns, fakeData]);

    // Render table filters
    const renderTableFilters = useCallback(
        (compName: string) => {
            if (filters.length === 0)
                return <GenNoInfoComp type="TABLE FILTERS" />;

            return (
                <div className="w-full grid grid-cols-4 gap-3">
                    {filters.map((child, index) => {
                        const Component = loadedComponents[child.id];

                        // Construct the path for tracking origin
                        const path = `${componentName}/${compName}`;

                        return Component ? (
                            <Draggable
                                key={child.id}
                                item={child}
                                index={index}
                                mode="MOVE"
                                layout="horizontal"
                                dropTargetId={componentId}
                                className={cn('border-none')}
                            >
                                <BoxField
                                    index={index}
                                    parentComp={comp}
                                    comp={child}
                                    path={path}
                                    onEdit={() => handleEdit(child, path)}
                                >
                                    <Component
                                        comp={child}
                                        onDragEnd={onDragEnd}
                                    />
                                </BoxField>
                            </Draggable>
                        ) : null;
                    })}
                </div>
            );
        },
        [filters, loadedComponents, componentId, comp, handleEdit]
    );

    // Separate TableFilter and TableColumn components
    const tableFilters = components.filter(
        (comp) => comp.componentName === COMPONENT.TableFilter
    );

    const tableColumns = components.filter(
        (comp) => comp.componentName === COMPONENT.TableColumn
    );

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            className="border-none p-0"
        >
            <div className="w-full flex flex-col gap-3">
                {/* Render TableFilter first */}
                {tableFilters.map((tableComp, index) => {
                    const { componentName: compName } = tableComp;

                    return (
                        <div
                            key={index}
                            className="bg-card rounded-lg border p-2 group/table"
                        >
                            <TableTool parentComp={comp} comp={tableComp} />
                            {renderTableFilters(compName)}
                        </div>
                    );
                })}

                {/* Render TableColumn next */}
                {tableColumns.map((tableComp, index) => {
                    const { componentName } = tableComp;

                    return (
                        <div
                            key={index}
                            className="bg-card rounded-lg border p-2 group/table"
                        >
                            <TableTool parentComp={comp} comp={tableComp} />
                            {columns.length === 0 ? (
                                <GenNoInfoComp
                                    type={getLabel(componentName).toUpperCase()}
                                />
                            ) : (
                                <div className="relative w-full overflow-x-auto">
                                    <Table className="table-auto">
                                        <TableHeader>
                                            <TableRow>
                                                {renderTableHeaders(
                                                    componentName
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>{renderTableRows}</TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Droppable>
    );
};

export default TableComp;
