import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import { cn } from '@renderer/lib/utils';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { COMPONENT } from '../../ComponentTypes';
import { Button } from '@renderer/components/ui/button';
import { Ellipsis } from 'lucide-react';
import BoxField from '../tools/BoxFields';
import TableTool from '../tools/tableTool';
import { Badge } from '@renderer/components/ui/badge';
import { useFakedata } from '../../hooks/useFakeData';
import { faker } from '@faker-js/faker';
import Droppable from '@renderer/lib/dnd/Droppable';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioTable: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const { children: components, componentName } = comp;
    const [columns, setColumns] = useState<StructuredComponent[]>([]);
    const [filters, setFilters] = useState<StructuredComponent[]>([]);

    const { setEditingComponent } = useDroppedComponents();
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

    // Handle edit click
    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component });
        },
        [setEditingComponent]
    );

    // Render table headers
    const renderTableHeaders = useCallback(
        (
            compName: string,
            dropTargetId: string,
            tableColumn: StructuredComponent
        ) => {
            return columns.map((child, index) => {
                const { label, properties } = child;
                const { headerTitle } = properties || {};

                // Construct the path for tracking origin
                const path = `${componentName}/${compName}`;

                return (
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
                                parentComp={tableColumn}
                                comp={child}
                                path={path}
                                onEdit={() => handleEdit(child, path)}
                                group="group/table-header"
                                className="opacity-0 group-hover/table-header:opacity-100 mt-3 z-50"
                            >
                                <span>{headerTitle || label}</span>
                            </BoxField>
                        </Draggable>
                    </TableHead>
                );
            });
        },
        [columns, handleEdit, componentName]
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
                            <Badge variant="secondary">
                                {faker.lorem.words(1)}
                            </Badge>
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
    }, [columns, getDataTableFake]);

    // Render table filters
    const renderTableFilters = useCallback(
        (compName: string, dropTargetId: string) => {
            return (
                <div className="flex flex-1">
                    {filters.map((child, index) => {
                        // Construct the path for tracking origin
                        const path = `${componentName}/${compName}`;

                        return (
                            <Draggable
                                key={child.id}
                                item={child}
                                index={index}
                                mode="MOVE"
                                layout="horizontal"
                                dropTargetId={dropTargetId}
                                className={cn('border-none  py-4')}
                            >
                                <BoxField
                                    index={index}
                                    parentComp={comp}
                                    comp={child}
                                    path={path}
                                    onEdit={() => handleEdit(child, path)}
                                    group="group/table-filter"
                                    className="opacity-0 group-hover/table-filter:opacity-100"
                                >
                                    <CardComponent
                                        comp={child}
                                        onDragEnd={onDragEnd}
                                    />
                                </BoxField>
                            </Draggable>
                        );
                    })}
                </div>
            );
        },
        [filters, componentName, comp, onDragEnd, handleEdit]
    );

    // Separate TableFilter and TableColumn components
    const tableFilters = components.filter(
        (comp) => comp.componentName === COMPONENT.TableFilter
    );

    const tableColumns = components.filter(
        (comp) => comp.componentName === COMPONENT.TableColumn
    );

    return (
        <div className="w-full flex flex-col space-y-3 pt-2">
            {/* Render TableFilter first */}
            {tableFilters.map((tableComp, index) => {
                const { componentName: compName, id } = tableComp;

                return (
                    <>
                        <TableTool
                            parentComp={comp}
                            comp={tableComp}
                            onEdit={() => handleEdit(tableComp, componentName)}
                            tableColumns={tableColumns[0].children}
                            group="group/table-filter"
                            className="opacity-0 group-hover/table-filter:opacity-100"
                        />
                        <Droppable
                            key={index}
                            className="bg-card rounded-lg border border-dashed border-gray-400 group/table"
                            component={tableComp}
                            onDrop={onDragEnd}
                            path={componentName}
                        >
                            {renderTableFilters(compName, id)}
                        </Droppable>
                    </>
                );
            })}

            {/* Render TableColumn next */}
            {tableColumns.map((tableComp, index) => {
                const { componentName: compName, id } = tableComp;
                return (
                    <>
                        <TableTool
                            parentComp={comp}
                            comp={tableComp}
                            onEdit={() => handleEdit(tableComp, componentName)}
                            group="group/table-column"
                            className="opacity-0 group-hover/table-column:opacity-100"
                        />
                        <Droppable
                            key={index}
                            className="bg-card rounded-lg border border-dashed border-gray-400 group/table"
                            component={tableComp}
                            onDrop={onDragEnd}
                            path={componentName}
                        >
                            {columns.length > 0 && (
                                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                    <Table className="w-full text-sm text-left rtl:text-right table-fixed">
                                        <TableHeader>
                                            <TableRow>
                                                {renderTableHeaders(
                                                    compName,
                                                    id,
                                                    tableComp
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>{renderTableRows}</TableBody>
                                    </Table>
                                </div>
                            )}
                        </Droppable>
                    </>
                );
            })}
        </div>
    );
};

export default IGRPStudioTable;
