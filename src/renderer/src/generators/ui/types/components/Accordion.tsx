import {
    IGRPAccordionContentPrimitive,
    IGRPAccordionItemPrimitive,
    IGRPAccordionPrimitive,
    IGRPAccordionTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'
import FieldTools from '../tools/FieldTools'

const IGRPStudioAccordion: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd
}: CardComponentProps) => {
    const {
        id: parentComponentId,
        children: components,
        componentName: parentComponentName,
        properties
    } = comp

    const { className } = properties || {}

    const { setEditingComponent } = useDroppedComponents()

    const handleEditClick = (component: StructuredComponent, componentName: string): void => {
        setEditingComponent({
            path: componentName,
            component
        })
    }

    const renderContent = (): React.ReactNode => {
        return components.map((child: StructuredComponent, index: number) => {
            const { children: components, id: componentId, componentName, properties } = child

            const { title } = properties || {}

            return (
                <Draggable
                    key={child.id}
                    item={child}
                    index={index}
                    dropTargetId={parentComponentId}
                    dropZone={true}
                    className={cn('bg-muted/0', className)}
                    mode="MOVE"
                >
                    <IGRPAccordionItemPrimitive value={componentId} key={index}>
                        <div className="relative group/accordion-trigger">
                            <IGRPAccordionTriggerPrimitive
                                iconName="ChevronDown"
                                showIcon
                                iconPlacement="end"
                            >
                                <span>{title || componentName}</span>
                            </IGRPAccordionTriggerPrimitive>
                            <div
                                className={cn(
                                    'absolute top-0 mt-1 bg-gray-600 text-white rounded opacity-0 group-hover/accordion-trigger:opacity-100 transition-opacity duration-200 shadow-lg left-0 right-auto'
                                )}
                            >
                                <FieldTools
                                    comp={child}
                                    parentComp={comp}
                                    path={undefined}
                                    index={index}
                                    onEdit={() => handleEditClick(child, parentComponentName)}
                                />
                            </div>
                        </div>
                        <IGRPAccordionContentPrimitive key={index} asChild>
                            <Droppable
                                onDrop={onDragEnd}
                                component={child}
                                className="rounded-lg border border-dashed min-h-[200px] py-6"
                            >
                                {components.length > 0 &&
                                    components.map((childTab: StructuredComponent, ii: number) => {
                                        return (
                                            <Draggable
                                                key={childTab.id}
                                                item={childTab}
                                                index={ii}
                                                dropTargetId={componentId}
                                                mode="MOVE"
                                            >
                                                <BoxWrapper
                                                    parentComp={child}
                                                    comp={childTab}
                                                    onEdit={() => handleEditClick(childTab, '')}
                                                    group="group/accordion-content"
                                                    className={cn(
                                                        'left-0 right-auto opacity-0 group-hover/accordion-content:opacity-100'
                                                    )}
                                                >
                                                    <CardComponent
                                                        comp={childTab}
                                                        onDragEnd={onDragEnd}
                                                    />
                                                </BoxWrapper>
                                            </Draggable>
                                        )
                                    })}
                            </Droppable>
                        </IGRPAccordionContentPrimitive>
                    </IGRPAccordionItemPrimitive>
                </Draggable>
            )
        })
    }

    return (
        <IGRPAccordionPrimitive
            defaultValue={components[0]?.id || ''}
            className="w-full"
            type="single"
            collapsible
        >
            <Droppable
                className={cn('flex w-full flex-col gap-3', className)}
                onDrop={onDragEnd}
                component={comp}
                path="accordion"
            >
                {renderContent()}
            </Droppable>
        </IGRPAccordionPrimitive>
    )
}

export default IGRPStudioAccordion
