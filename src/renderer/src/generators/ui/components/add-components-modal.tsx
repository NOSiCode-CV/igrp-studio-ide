import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
    IGRPSidebarInsetPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { EmptyList } from '@renderer/components/empty-list'
import useStudio from '@renderer/hooks/use-studio'
import useToast from '@renderer/hooks/useToast'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { Destination, DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import * as LucideIcons from 'lucide-react'
import { Plus } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ICON_MAP } from '../ComponentTypes'
import { handleDragEnd } from '../dnd/DraggableItemManager'
import { useDroppedComponents } from '../dnd/DroppedComponentsContext'
import { useTagManager } from '../hooks/useTagManager'
import SidebarRight from './sidebar/sidebar-right'

interface AddComponentProps {
    path: string
    comp: StructuredComponent
    parentComp: StructuredComponent
    open: boolean
    setOpen: (open: boolean) => void
}

export const AddComponentModal = ({ path, comp, parentComp, open, setOpen }: AddComponentProps) => {
    const { componentName, id, children } = comp
    const { t } = useTranslation()

    const [currentComponent, setCurrentComponent] = useState<StructuredComponent>(comp)

    const [currentPath, setCurrentPath] = useState<string>(path)

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([])

    const { getAcceptedChildren } = useStudio()

    const {
        handleAddChildToComponent,
        handleRemoveChildFromComponent,
        handleReorderChildInComponent,
        components: allComponents
    } = useDroppedComponents()

    const { generateTag, rebuild } = useTagManager(allComponents)
    const { findComponent } = useStudio()
    const { showErrorToast } = useToast()

    // Fetch and filter components on mount
    useEffect(() => {
        getAcceptedChildren(path, componentName).then((data) => {
            setComponents(data)
        })
    }, [componentName, getAcceptedChildren, path])

    // Handle adding a component
    const handleAddComponent = useCallback(
        (item: any, droppableId: string) => {
            const result: DragEndResult = {
                type: '',
                draggableId: item.name,
                source: item,
                destination: {
                    droppableId,
                    index: children.length + 1
                },
                mode: 'DROP'
            }

            handleDragEnd(result, {
                handleAddChildToComponent,
                handleReorderChildInComponent,
                generateTag,
                findComponent,
                showErrorToast
            })
        },
        [
            children.length,
            generateTag,
            handleAddChildToComponent,
            handleReorderChildInComponent,
            findComponent,
            showErrorToast
        ]
    )

    const handleOrderComponent = useCallback(
        (result: DragEndResult) => {
            handleDragEnd(result, {
                handleAddChildToComponent,
                handleReorderChildInComponent,
                generateTag,
                findComponent,
                showErrorToast
            })
        },
        [
            generateTag,
            handleAddChildToComponent,
            handleReorderChildInComponent,
            findComponent,
            showErrorToast
        ]
    )

    const onEditComponent = (component: StructuredComponent, parentComponent?: string) => {
        setCurrentComponent(component)
        setCurrentPath(
            `${path}/${comp.componentName}${parentComponent ? '/' + parentComponent : ''}`
        )
    }

    useEffect(() => {
        rebuild()
    }, [rebuild])

    return (
        <>
            <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
                <IGRPDialogContentPrimitive className="p-0 flex overflow-hidden [--header-height-three:calc(--spacing(75))] max-w-[80vw]! h-[80vh]!">
                    <IGRPSidebarInsetPrimitive>
                        <IGRPDialogHeaderPrimitive className="p-4">
                            <div className="flex justify-between">
                                <div>
                                    <IGRPDialogTitlePrimitive>
                                        {t('manageComponents')}
                                    </IGRPDialogTitlePrimitive>
                                    <IGRPDialogDescriptionPrimitive>
                                        {t('config')} - {componentName}
                                    </IGRPDialogDescriptionPrimitive>
                                </div>
                                <div className="justify-end">
                                    {renderAddComponents(components, id, handleAddComponent, t)}
                                </div>
                            </div>
                        </IGRPDialogHeaderPrimitive>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="space-y-3">
                                <div>
                                    {children.length > 0 ? (
                                        <ComponentTable
                                            parentComp={comp}
                                            components={children}
                                            registryComponents={components}
                                            onEdit={onEditComponent}
                                            onOrderComponent={handleOrderComponent}
                                            handleAddComponent={handleAddComponent}
                                            handleRemoveChildFromComponent={
                                                handleRemoveChildFromComponent
                                            }
                                        />
                                    ) : (
                                        <>
                                            <EmptyList description="" />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Helper Section */}
                            <div className="p-2 text-xs text-muted-foreground border-b bg-muted rounded-t mt-6">
                                <p className="mb-2">
                                    <strong>rowData</strong> is a variable provided by the table
                                    that contains all the data from the current row. Use it in your
                                    click handlers to access row information.
                                </p>
                                <p className="mb-2">Available data in rowData:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>
                                        <code>rowData.id</code> - Row identifier
                                    </li>
                                    <li>
                                        <code>rowData.nome</code> - Name field
                                    </li>
                                    <li>
                                        <code>rowData.status</code> - Status field
                                    </li>
                                    <li>
                                        <code>rowData.data</code> - Date field
                                    </li>
                                </ul>
                                <p className="mt-2 mb-2">Example usage in table actions:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>
                                        <code>handleView</code>
                                    </li>
                                    <li>
                                        <code>() =&gt; handleView(rowData.id)</code>
                                    </li>
                                    <li>
                                        <code>() =&gt; handleEdit(rowData)</code>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </IGRPSidebarInsetPrimitive>
                    <SidebarRight
                        comp={currentComponent}
                        path={currentPath}
                        parentComp={parentComp}
                    />
                </IGRPDialogContentPrimitive>
            </IGRPDialogPrimitive>
        </>
    )
}

const renderAddComponents = (
    components: ComponentRegisterConfig[],
    droppableId: string,
    handleAddComponent: (comp: ComponentRegisterConfig, droppableId: string) => void,
    t: any
) => {
    return (
        <IGRPDropdownMenuPrimitive>
            <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive variant="outline" size={'sm'}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('addComponent')}
                </IGRPButtonPrimitive>
            </IGRPDropdownMenuTriggerPrimitive>
            <IGRPDropdownMenuContentPrimitive align="end">
                {components.map((comp) => (
                    <IGRPDropdownMenuItemPrimitive
                        key={comp.name}
                        onSelect={() => handleAddComponent(comp, droppableId)}
                    >
                        {comp.label}
                    </IGRPDropdownMenuItemPrimitive>
                ))}
            </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
    )
}

const RenderCreatedComponents = ({
    parentComp,
    components,
    registryComponents,
    onEdit,
    handleAddComponent,
    level = 0,
    parentComponent,
    handleRemoveChildFromComponent,
    onOrderComponent
}: {
    parentComp: StructuredComponent
    components: StructuredComponent[]
    registryComponents: ComponentRegisterConfig[]
    onEdit: (comp: StructuredComponent, parentComponent?: string) => void
    handleAddComponent: (item: any, droppableId: string) => void
    level?: number // Add a level parameter to track nesting depth
    parentComponent?: string
    handleRemoveChildFromComponent?: (destination: Destination) => void
    onOrderComponent: (result: DragEndResult) => void
}) => {
    const { t } = useTranslation()

    const handleEditComponent = (component: StructuredComponent, parentComponent?: string) => {
        onEdit(component, parentComponent)
    }

    // Render the icon for a component
    const renderIcon = (iconName: string) => {
        try {
            const IconComponent =
                LucideIcons[iconName as keyof typeof LucideIcons] ?? ICON_MAP[iconName]
            if (IconComponent && typeof IconComponent === 'function') {
                // Check if it's a React component by trying to render it
                return React.createElement(IconComponent as React.ComponentType<any>, {
                    className: 'h-4 w-4'
                })
            }
        } catch (error) {
            console.warn(`Failed to render icon: ${iconName}`, error)
        }
        return null
    }

    // Check if the component can accept children
    const canAcceptChildren = (component: StructuredComponent) => {
        const registryComponent = registryComponents.find(
            (rc) => rc.name === component.componentName
        )
        return registryComponent && registryComponent.acceptedChildren.length > 0
    }

    // Get the accepted children for a component
    const getAcceptedChildren = (component: StructuredComponent) => {
        const registryComponent = registryComponents.find(
            (rc) => rc.name === component.componentName
        )
        return registryComponent ? registryComponent.acceptedChildren : []
    }

    // Recursively render child components
    const RenderChildComponents = ({
        parentComp,
        children,
        level,
        parentComponent
    }: {
        parentComp: StructuredComponent
        children: StructuredComponent[]
        level: number
        parentComponent: string
    }) => {
        return (
            <RenderCreatedComponents
                parentComp={parentComp}
                components={children}
                registryComponents={registryComponents}
                onEdit={onEdit}
                handleAddComponent={handleAddComponent}
                level={level + 1}
                parentComponent={parentComponent}
                handleRemoveChildFromComponent={handleRemoveChildFromComponent}
                onOrderComponent={onOrderComponent}
            />
        )
    }

    return (
        <Droppable
            component={parentComp}
            onDrop={onOrderComponent}
            className="w-full bg-none min-h-[unset] p-0"
        >
            {components.map((component, index) => {
                const { properties, label, id } = component

                return (
                    <React.Fragment key={index}>
                        <div className="grid grid-cols-[1fr_auto] px-3 py-1 mb-0 border-b last:border-b-0 hover:bg-muted/50">
                            <div className="font-medium" style={{ paddingLeft: `${level * 20}px` }}>
                                <Draggable
                                    item={component}
                                    index={index}
                                    mode="MOVE"
                                    layout="vertical"
                                    dropTargetId={parentComp?.id}
                                    className={cn('border-none flex flex-1 items-center space-x-3')}
                                >
                                    <button disabled>
                                        <LucideIcons.GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {renderIcon(properties?.iconProperties?.iconName)}
                                        <span className="text-sm">{`${label} (${properties?.labelTrigger || 'Click'})`}</span>
                                    </div>
                                </Draggable>
                            </div>
                            <div className="flex gap-2">
                                <IGRPButtonPrimitive
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditComponent(component, parentComponent)}
                                >
                                    <LucideIcons.Edit />
                                    <span className="sr-only">Edit</span>
                                </IGRPButtonPrimitive>
                                <IGRPButtonPrimitive
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() =>
                                        handleRemoveChildFromComponent?.({
                                            droppableId: id,
                                            index
                                        })
                                    }
                                >
                                    <LucideIcons.Trash />
                                    <span className="sr-only">Delete</span>
                                </IGRPButtonPrimitive>
                                {canAcceptChildren(component) &&
                                    renderAddComponents(
                                        getAcceptedChildren(component),
                                        id,
                                        handleAddComponent,
                                        t
                                    )}
                            </div>
                        </div>
                        {component.children && component.children.length > 0 && (
                            <RenderChildComponents
                                parentComp={component}
                                children={component.children}
                                level={level}
                                parentComponent={component.componentName}
                            />
                        )}
                    </React.Fragment>
                )
            })}
        </Droppable>
    )
}

// Main component that renders the table with a single header
const ComponentTable = ({
    parentComp,
    components,
    registryComponents,
    onEdit,
    handleAddComponent,
    handleRemoveChildFromComponent,
    onOrderComponent
}: {
    parentComp: StructuredComponent
    components: StructuredComponent[]
    registryComponents: ComponentRegisterConfig[]
    onEdit: (comp: StructuredComponent, parentComponent?: string) => void
    onOrderComponent: (result: DragEndResult) => void
    handleAddComponent: (item: any, droppableId: string) => void
    handleRemoveChildFromComponent: (destination: Destination) => void
}) => {
    const { t } = useTranslation()
    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-muted/50 border-b">
                <div className="grid grid-cols-[1fr_auto] gap-4 p-3 mx-6">
                    <div className="font-medium text-sm">{t('label')}</div>
                    <div className="font-medium text-sm">{t('actions')}</div>
                </div>
            </div>
            {/* Table Body */}
            <RenderCreatedComponents
                parentComp={parentComp}
                components={components}
                registryComponents={registryComponents}
                onEdit={onEdit}
                handleAddComponent={handleAddComponent}
                handleRemoveChildFromComponent={handleRemoveChildFromComponent}
                onOrderComponent={onOrderComponent}
            />
        </div>
    )
}
