import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { useCallback } from 'react'
import { COMPONENT } from '../../ComponentTypes'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'

const IGRPStudioModalDialog: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const { children: components, componentName: parentComponentName } = comp

    const { setEditingComponent } = useDroppedComponents()

    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component })
        },
        [setEditingComponent]
    )

    const renderChildComp = useCallback(
        (component: StructuredComponent, path: string) => {
            const { children: childComponents, id: componentId } = component

            return (
                <Droppable component={component} onDrop={onDragEnd} className={cn('p-2 space-y-3')}>
                    {childComponents.length > 0 &&
                        childComponents.map((child, index) => {
                            return (
                                <Draggable
                                    key={child.id}
                                    item={child}
                                    index={index}
                                    mode="MOVE"
                                    dropTargetId={componentId}
                                    className="py-4"
                                >
                                    <BoxWrapper
                                        parentComp={component}
                                        comp={child}
                                        path={path}
                                        onEdit={() => handleEdit(child, path)}
                                        group="group/dialog-item"
                                        className="opacity-0 group-hover/dialog-item:opacity-100"
                                    >
                                        <CardComponent comp={child} onDragEnd={onDragEnd} />
                                    </BoxWrapper>
                                </Draggable>
                            )
                        })}
                </Droppable>
            )
        },
        [handleEdit, onDragEnd]
    )

    return (
        <div className="flex flex-col gap-2">
            {components.map((child, index) => {
                const { componentName } = child
                const path = `${parentComponentName}/${componentName}`
                return (
                    <div
                        key={index}
                        className={cn('bg-card rounded-lg border border-dashed border-gray-400')}
                    >
                        <BoxWrapper
                            key={index}
                            parentComp={comp}
                            comp={child}
                            onEdit={() => handleEdit(child, parentComponentName)}
                            group="group/dialog"
                            className="opacity-0 group-hover/dialog:opacity-100"
                        >
                            {renderChildComp(child, path)}
                        </BoxWrapper>
                    </div>
                )
            })}
        </div>
    )
}

// Add small components for dialog parts

const IGRPSTudioDialogHeader: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const { setEditingComponent } = useDroppedComponents()

    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component })
        },
        [setEditingComponent]
    )

    const { children: childComponents, componentName, id: componentId } = comp

    return (
        <div className="space-y-3">
            {childComponents.map((child, index) => {
                const { properties } = child
                const { content } = properties

                const path = `${COMPONENT.ModalDialog}/${COMPONENT.ModalDialogContent}/${componentName}`

                return (
                    <Draggable
                        key={child.id}
                        item={child}
                        index={index}
                        mode="MOVE"
                        dropTargetId={componentId}
                        className={cn('p-1')}
                    >
                        <BoxWrapper
                            parentComp={comp}
                            comp={child}
                            path={`${COMPONENT.ModalDialog}/${COMPONENT.ModalDialogContent}`}
                            onEdit={() => handleEdit(child, path)}
                            group="group/card-dialog-header"
                            className="top-0 opacity-0 group-hover/card-dialog-header:opacity-100"
                        >
                            <>
                                {content ? (
                                    content
                                ) : (
                                    <CardComponent comp={child} onDragEnd={onDragEnd} />
                                )}
                            </>
                        </BoxWrapper>
                    </Draggable>
                )
            })}
        </div>
    )
}

const IGRPSTudioDialogFooter: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const { setEditingComponent } = useDroppedComponents()

    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component })
        },
        [setEditingComponent]
    )

    const { children: childComponents, componentName, id: componentId } = comp

    return (
        <Droppable component={comp} onDrop={onDragEnd} className={cn('p-2 space-y-3')}>
            {childComponents.length > 0 &&
                childComponents.map((child, index) => {
                    return (
                        <Draggable
                            key={child.id}
                            item={child}
                            index={index}
                            mode="MOVE"
                            dropTargetId={componentId}
                            layout="horizontal"
                            className={cn('p-1')}
                        >
                            <BoxWrapper
                                parentComp={comp}
                                comp={child}
                                onEdit={() =>
                                    handleEdit(
                                        child,
                                        `${COMPONENT.ModalDialog}/${COMPONENT.ModalDialogContent}/${componentName}`
                                    )
                                }
                                group="group/card-dialog-footer"
                                className="opacity-0 group-hover/card-dialog-footer:opacity-100"
                            >
                                <>
                                    <CardComponent comp={child} onDragEnd={onDragEnd} />
                                </>
                            </BoxWrapper>
                        </Draggable>
                    )
                })}
        </Droppable>
    )
}

const IGRPSTudioDialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-lg font-bold">{children || 'no title provided'}</h2>
)

const IGRPStudioDialogDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-sm text-gray-500">{children || 'no title description'}</p>
)

const IGRPStudioDialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="py-2">{children}</div>
)

const IGRPStudioDialogTrigger: React.FC<CardComponentProps> = ({ comp }) => {
    const { properties } = comp
    const { content, ...args } = properties
    return (
        <div className="py-2">
            <IGRPButtonPrimitive {...args}>{content}</IGRPButtonPrimitive>
        </div>
    )
}

export {
    IGRPSTudioDialogHeader,
    IGRPSTudioDialogFooter,
    IGRPStudioModalDialog,
    IGRPSTudioDialogTitle,
    IGRPStudioDialogDescription,
    IGRPStudioDialogContent,
    IGRPStudioDialogTrigger
}
