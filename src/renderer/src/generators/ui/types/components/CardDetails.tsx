import {
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive,
    IGRPCopyTo,
    IGRPSeparatorPrimitive
} from '@igrp/igrp-framework-react-design-system'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import type { CardComponentProps } from '../CardComponent'
import FieldTools from '../tools/FieldTools'

const IGRPStudioCardDetails: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd
}: CardComponentProps) => {
    const {
        id: parentComponentId,
        children: components,
        componentName: parentComponentName,
        properties
    } = comp

    const { className, title, description, contentClassName } = properties || {}

    const { setEditingComponent } = useDroppedComponents()

    const handleEditClick = (component: StructuredComponent, componentName: string): void => {
        setEditingComponent({
            path: componentName,
            component
        })
    }

    return (
        <IGRPCardPrimitive
            className={cn(
                'overflow-hidden gap-3 animate-fade-in motion-reduce:animate-none',
                'transition-all duration-200 hover:shadow-lg hover:border-primary/20'
            )}
            {...properties}
        >
            {(title || description) && (
                <IGRPCardHeaderPrimitive className="pb-4">
                    {title && <IGRPCardTitlePrimitive>{title}</IGRPCardTitlePrimitive>}
                    {description && (
                        <IGRPCardDescriptionPrimitive>{description}</IGRPCardDescriptionPrimitive>
                    )}
                    <IGRPSeparatorPrimitive className="mt-4" />
                </IGRPCardHeaderPrimitive>
            )}
            <IGRPCardContentPrimitive className={cn(contentClassName)}>
                <Droppable
                    className={cn('flex w-full flex-col gap-3', className)}
                    onDrop={onDragEnd}
                    component={comp}
                    path="cardDetails"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm relative group/card-details-trigger">
                        {components.map((child: StructuredComponent, key: number) => {
                            const { label, value, showCopyTo } = child.properties || {}

                            return (
                                <Draggable
                                    key={child.id}
                                    item={child}
                                    index={key}
                                    dropTargetId={parentComponentId}
                                    dropZone={true}
                                    className={cn('bg-muted/0', className)}
                                    mode="MOVE"
                                >
                                    <div
                                        className={cn(
                                            'absolute top-0 mt-1 bg-gray-600 text-white rounded opacity-0 group-hover/card-details-trigger:opacity-100 transition-opacity duration-200 shadow-lg left-0 right-auto'
                                        )}
                                    >
                                        <FieldTools
                                            comp={child}
                                            parentComp={comp}
                                            path={undefined}
                                            index={key}
                                            onEdit={() =>
                                                handleEditClick(child, parentComponentName)
                                            }
                                        />
                                    </div>
                                    <div key={key} className="flex items-center gap-4">
                                        <div>
                                            <h3 className="font-normal text-muted-foreground">
                                                {label}
                                            </h3>
                                            {typeof value === 'string' ? (
                                                <span className="font-medium">{value}</span>
                                            ) : (
                                                value
                                            )}
                                        </div>
                                        {showCopyTo && <IGRPCopyTo value={value as string} />}
                                    </div>
                                </Draggable>
                            )
                        })}
                    </div>
                </Droppable>
            </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
    )
}

export default IGRPStudioCardDetails
