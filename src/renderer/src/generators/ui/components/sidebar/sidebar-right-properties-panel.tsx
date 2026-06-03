import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@renderer/components/ui/accordion'
import { type IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system'
import type { State } from '@igrp/igrp-studio-nextjs-engine/types'
import type { DataValue, StructuredComponent } from '@renderer/lib/dnd/types'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import RenderPropsConfig from '../settings/properties'

interface PropertiesPanelProps {
    propsComponent: Record<string, any>
    propsComponentChild: Record<string, any>
    tempEditingComponent: StructuredComponent
    childformValues: Record<string, any>
    pageOptions: any
    statesOptions: any
    columnsOptions: (IGRPOptionsProps & { type?: 'column' | 'pageParam' })[]
    onComponentPropertyChange: (fieldPath: string, value: string | boolean) => void
    onChildPropertyChange: (fieldPath: string, value: string | boolean) => void
    onSelectState: (field: string, state: State | undefined, value: DataValue | undefined) => void
}

const PropertiesPanel = memo(function PropertiesPanel({
    propsComponent,
    propsComponentChild,
    tempEditingComponent,
    childformValues,
    pageOptions,
    statesOptions,
    columnsOptions,
    onComponentPropertyChange,
    onChildPropertyChange,
    onSelectState
}: PropertiesPanelProps) {
    const { t } = useTranslation()
    const tag = tempEditingComponent.tag || ''

    return (
        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
            <AccordionItem value="item-1">
                <AccordionTrigger iconName="ChevronDown" showIcon iconPlacement="end">
                    {t('properties')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                    {propsComponent && (
                        <RenderPropsConfig
                            propsComp={propsComponent}
                            formValues={tempEditingComponent.properties}
                            pageOptions={pageOptions}
                            dataProperties={tempEditingComponent.data}
                            statesOptions={statesOptions}
                            columnsOptions={columnsOptions}
                            tag={tag}
                            onInputChange={onComponentPropertyChange}
                            onSelectState={onSelectState}
                        />
                    )}
                </AccordionContent>
            </AccordionItem>
            {Object.keys(propsComponentChild).length > 0 && (
                <AccordionItem value="item-2">
                    <AccordionTrigger iconName="ChevronDown" showIcon iconPlacement="end">
                        {t('childProperties')}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        <RenderPropsConfig
                            propsComp={propsComponentChild}
                            formValues={childformValues}
                            pageOptions={pageOptions}
                            dataProperties={tempEditingComponent.data}
                            statesOptions={statesOptions}
                            columnsOptions={columnsOptions}
                            tag={tag}
                            onInputChange={onChildPropertyChange}
                            onSelectState={onSelectState}
                        />
                    </AccordionContent>
                </AccordionItem>
            )}
        </Accordion>
    )
})

export default PropertiesPanel
