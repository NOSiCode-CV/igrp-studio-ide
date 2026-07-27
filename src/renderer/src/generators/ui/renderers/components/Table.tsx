import { faker } from '@faker-js/faker'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@renderer/components/ui/table'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { Ellipsis, Settings2 } from 'lucide-react'
import type React from 'react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { COMPONENT } from '../../ComponentTypes'
import { AddComponentModal } from '../../components/modals/add-components-modal'
import { useDroppedComponents } from '../../contexts/EditorContext'
import { useFakedata } from '../../hooks/useFakeData'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxField from '../tools/BoxFields'
import TableTool from '../tools/tableTool'

const IGRPStudioTable: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const { children: components, componentName } = comp
    const [columns, setColumns] = useState<StructuredComponent[]>([])
    const [filters, setFilters] = useState<StructuredComponent[]>([])
    const [manageColumnsOpen, setManageColumnsOpen] = useState(false)

    const { setEditingComponent } = useDroppedComponents()
    const { getDataTableFake } = useFakedata()

    // Extract table columns and filters from components
    useEffect(() => {
        const tableColumn = components.find((comp) => comp.componentName === COMPONENT.TableColumn)
        const tableFilter = components.find((comp) => comp.componentName === COMPONENT.TableFilter)
        setColumns(tableColumn?.children || [])
        setFilters(tableFilter?.children || [])
    }, [components])

    // Handle edit click
    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component })
        },
        [setEditingComponent]
    )

    // Render table headers
    const renderTableHeaders = useCallback(
        (compName: string, dropTargetId: string, tableColumn: StructuredComponent) => {
            return columns.map((child, index) => {
                const { label, properties } = child
                const { headerTitle } = properties || {}

                // Construct the path for tracking origin
                const path = `${componentName}/${compName}`

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
                )
            })
        },
        [columns, handleEdit, componentName]
    )

    // Render table rows
    const renderTableRows = useMemo(() => {
        return getDataTableFake(columns).map((row, rowIndex) => (
            <TableRow key={rowIndex}>
                {columns.map((child) => (
                    <TableCell key={child.id}>
                        {child.componentName === COMPONENT.TableCheckboxCell ? (
                            <Checkbox id={child.id} checked={row[child.id] as boolean} />
                        ) : child.componentName === COMPONENT.TableableBadgeCell ? (
                            <Badge variant="outline">{faker.lorem.words(1)}</Badge>
                        ) : child.componentName === COMPONENT.TableActionListCell ? (
                            <Button variant="secondary" size="icon">
                                <Ellipsis />
                            </Button>
                        ) : (
                            row[child.id]
                        )}
                    </TableCell>
                ))}
            </TableRow>
        ))
    }, [columns, getDataTableFake])

    // Render table filters
    const renderTableFilters = useCallback(
        (compName: string, dropTargetId: string) => {
            return (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    {filters.map((child, index) => {
                        // Construct the path for tracking origin
                        const path = `${componentName}/${compName}`

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
                                    <CardComponent comp={child} onDragEnd={onDragEnd} />
                                </BoxField>
                            </Draggable>
                        )
                    })}
                </div>
            )
        },
        [filters, componentName, comp, onDragEnd, handleEdit]
    )

    // Separate TableFilter and TableColumn components
    const tableFilters = components.filter((comp) => comp.componentName === COMPONENT.TableFilter)

    const tableColumns = components.filter((comp) => comp.componentName === COMPONENT.TableColumn)

    // Optional expanded-row child (engine: `tableRowSubcomponent`, isDefault
    // false — not created on drop, added via the strip below).
    const tableRowSubs = components.filter(
        (comp) => comp.componentName === COMPONENT.TableRowSubcomponent
    )

    return (
        <div className="flex w-full min-w-0 max-w-full flex-col space-y-3 pt-2">
            {/* Always-visible entry point to manage columns in a large modal,
                so editing does not depend on the cramped hover toolbars. */}
            {tableColumns.length > 0 && (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setManageColumnsOpen(true)}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Manage Columns
                    </Button>
                </div>
            )}

            {manageColumnsOpen && tableColumns[0] && (
                <AddComponentModal
                    open={manageColumnsOpen}
                    setOpen={setManageColumnsOpen}
                    comp={tableColumns[0]}
                    parentComp={comp}
                    path={componentName}
                />
            )}

            {/* Render TableFilter first */}
            {tableFilters.map((tableComp, index) => {
                const { componentName: compName, id } = tableComp

                return (
                    <>
                        <TableTool
                            parentComp={comp}
                            comp={tableComp}
                            onEdit={() => handleEdit(tableComp, componentName)}
                            tableColumns={tableColumns[0].children}
                            group="group/table-filter"
                            className="opacity-0 group-hover/table-filter:opacity-100"
                            index={index}
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
                )
            })}

            {/* Render TableColumn next */}
            {tableColumns.map((tableComp, index) => {
                const { componentName: compName, id } = tableComp
                return (
                    <>
                        <TableTool
                            parentComp={comp}
                            comp={tableComp}
                            onEdit={() => handleEdit(tableComp, componentName)}
                            group="group/table-column"
                            className="opacity-0 group-hover/table-column:opacity-100"
                            index={index}
                        />
                        <Droppable
                            key={index}
                            className="group/table min-w-0 max-w-full rounded-lg border border-dashed border-gray-400 bg-card"
                            component={tableComp}
                            onDrop={onDragEnd}
                            path={componentName}
                        >
                            {columns.length > 0 && (
                                <div className="relative rounded-lg shadow-md">
                                    <Table className="text-left text-sm rtl:text-right">
                                        <TableHeader>
                                            <TableRow>
                                                {renderTableHeaders(compName, id, tableComp)}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>{renderTableRows}</TableBody>
                                    </Table>
                                </div>
                            )}
                        </Droppable>
                    </>
                )
            })}

            {/* Expanded-row subcomponent (optional; added via the table's
                "Add Comp" toolbar — engine acceptedChildren) */}
            {tableRowSubs.map((tableComp) => (
                <Fragment key={tableComp.id}>
                    <TableTool
                        parentComp={comp}
                        comp={tableComp}
                        onEdit={() => handleEdit(tableComp, componentName)}
                        group="group/table-rowsub"
                        className="opacity-0 group-hover/table-rowsub:opacity-100"
                        index={components.indexOf(tableComp)}
                    />
                    <div className="group/table">
                        <CardComponent comp={tableComp} onDragEnd={onDragEnd} />
                    </div>
                </Fragment>
            ))}
        </div>
    )
}

export default IGRPStudioTable
