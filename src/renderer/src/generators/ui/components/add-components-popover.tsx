import {
    IGRPBadgePrimitive,
    IGRPPopoverContentPrimitive,
    IGRPPopoverPrimitive,
    IGRPPopoverTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import useStudio from '@renderer/hooks/use-studio'
import useToast from '@renderer/hooks/useToast'
import type { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ICON_MAP } from '../ComponentTypes'
import { handleDragEnd } from '../dnd/DraggableItemManager'
import { useDroppedComponents } from '../contexts/EditorContext'
import { useTagManager } from '../hooks/useTagManager'

export const AddComponentPopover = ({
    comp,
    components
}: {
    components: ComponentRegisterConfig[]
    comp: StructuredComponent
}) => {
    const { t } = useTranslation()

    const { componentName, id: componentId, children } = comp
    const {
        handleAddChildToComponent,
        handleReorderChildInComponent,
        components: availableComponents
    } = useDroppedComponents()
    const { generateTag, rebuild } = useTagManager(availableComponents)
    const { findComponent } = useStudio()
    const { showErrorToast } = useToast()

    const handleAddComponent = (item: any) => {
        const result: DragEndResult = {
            type: '',
            draggableId: item.name,
            source: item,
            destination: {
                droppableId: componentId,
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
    }

    const renderIcon = (iconName: string) => {
        const IconComponent = ICON_MAP[iconName]

        return IconComponent ? <IconComponent className="h-5 w-5" /> : null
    }

    useEffect(() => {
        rebuild()
    }, [rebuild])

    return (
        <IGRPPopoverPrimitive>
            <IGRPPopoverTriggerPrimitive asChild>
                <IGRPBadgePrimitive variant={'secondary'} className="rounded-sm cursor-pointer h-6">
                    <span className="text-xs">Add Comp</span>
                </IGRPBadgePrimitive>
            </IGRPPopoverTriggerPrimitive>
            <IGRPPopoverContentPrimitive className="w-100 p-3 space-y-3">
                <div className="p-2 border-b">
                    <h3 className="text-lg font-semibold">{t('addComponent')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('selectComponent')} {componentName}
                    </p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {components &&
                        components.map((component) => (
                            <button
                                key={component.name}
                                className="flex flex-col items-center justify-center rounded-md border bg-background p-2 text-xs transition-colors hover:bg-muted aspect-square"
                                onClick={() => handleAddComponent(component)}
                            >
                                <div className="mb-1">{renderIcon(component.name)}</div>
                                {component.label}
                            </button>
                        ))}
                </div>
            </IGRPPopoverContentPrimitive>
        </IGRPPopoverPrimitive>
    )
}
