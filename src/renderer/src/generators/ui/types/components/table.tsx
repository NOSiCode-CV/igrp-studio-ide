import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import useStudio from '@renderer/hooks/use-studio';
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
import { getLabel } from '@renderer/utils/helpers';
import { cn } from '@renderer/lib/utils';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { COMPONENT } from '../../ComponentTypes';
import { Button } from '@renderer/components/ui/button';
import { Ellipsis } from 'lucide-react';
import BoxField from '../tools/BoxFields';
import TableTool from '../tools/tableTool';
import Droppable from '@renderer/lib/dnd/Droppable';
import { Badge } from '@renderer/components/ui/badge';
import { useFakedata } from '../../hooks/useFakeData';

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
    const { getDataTableFake } = useFakedata();

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

    // Handle edit click
    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component });
        },
        [comp, setEditingComponent]
    );

    // Render table headers
    const renderTableHeaders = useCallback(
        (compName: string, dropTargetId: string) => {
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
                            dropTargetId={dropTargetId}
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
        return getDataTableFake(columns).map((row, rowIndex) => (
            <TableRow key={rowIndex}>
                {columns.map((child) => (
                    <TableCell key={child.id}>
                        {child.componentName === COMPONENT.TableCheckboxCell ? (
                            <Checkbox id={child.id} checked={row[child.id]} />
                        ) : child.componentName ===
                          COMPONENT.TableableBadgeCell ? (
                            <Badge variant="secondary">Badge</Badge>
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
    }, [columns]);

    // Render table filters
    const renderTableFilters = useCallback(
        (compName: string, dropTargetId: string) => {
            if (filters.length === 0)
                return <GenNoInfoComp type="TABLE FILTERS" />;

            return (
                <div className="flex flex-1">
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
                                dropTargetId={dropTargetId}
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
        <div className="w-full flex flex-col gap-3">
            {/* Render TableFilter first */}
            {tableFilters.map((tableComp, index) => {
                const { componentName: compName, id } = tableComp;

                return (
                    <Droppable
                        key={index}
                        className="bg-card rounded-lg border border-dashed border-gray-400 p-2 group/table"
                        component={tableComp}
                        onDrop={onDragEnd}
                    >
                        <TableTool
                            parentComp={comp}
                            comp={tableComp}
                            onEdit={() => handleEdit(tableComp, componentName)}
                            tableColumns={tableColumns[0].children}
                        />
                        {renderTableFilters(compName, id)}
                    </Droppable>
                );
            })}

            {/* Render TableColumn next */}
            {tableColumns.map((tableComp, index) => {
                const { componentName, id } = tableComp;
                return (
                    <Droppable
                        key={index}
                        className="bg-card rounded-lg border border-dashed border-gray-400 p-2 group/table"
                        component={tableComp}
                        onDrop={onDragEnd}
                    >
                        <TableTool
                            parentComp={comp}
                            comp={tableComp}
                            onEdit={() => handleEdit(tableComp, componentName)}
                        />
                        {columns.length === 0 ? (
                            <GenNoInfoComp
                                type={getLabel(componentName).toUpperCase()}
                            />
                        ) : (
                            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                <Table className="w-full text-sm text-left rtl:text-right table-fixed">
                                    <TableHeader>
                                        <TableRow>
                                            {renderTableHeaders(
                                                componentName,
                                                id
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>{renderTableRows}</TableBody>
                                </Table>
                            </div>
                        )}
                    </Droppable>
                );
            })}
        </div>
    );
};

export default TableComp;
