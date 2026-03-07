import {
    IGRPAccordionContentPrimitive,
    IGRPAccordionItemPrimitive,
    IGRPAccordionPrimitive,
    IGRPAccordionTriggerPrimitive,
    IGRPButtonPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import {
    Box,
    Layers,
    Layout,
    Move,
    Palette,
    RotateCcw,
    Settings2,
    SquareIcon,
    Type,
    Variable
} from 'lucide-react'
import React, { useEffect } from 'react'
import { BackgroundsSection } from './components/BackgroundsSection'
import { BordersSection } from './components/BordersSection'
import { CustomPropertiesSection } from './components/CustomPropertiesSection'
import { EffectsSection } from './components/EffectsSection'
import { LayoutSection } from './components/LayoutSection'
import { PositionSection } from './components/PositionSection'
import { SizeSection } from './components/SizeSection'
import { SpacingSection } from './components/SpacingSection'
import { TypographySection } from './components/TypographySection'
import type { StyleComponent } from './types'
import { generateAllClasses } from './utils'

interface StyleSection {
    id: string
    title: string
    icon: React.ReactNode
    isOpen: boolean
    component: React.ComponentType<{
        onChangeStyles: (styles: StyleComponent) => void
        styles: StyleComponent
        resetStyles: (sectionKey: keyof StyleComponent) => void
    }>
}

interface StyleTabProps {
    comp: StructuredComponent
    path: string
    onInteranctionsChange: (componentId: string, updates: Partial<StructuredComponent>) => void
}

export function StyleTab({ comp, onInteranctionsChange }: StyleTabProps) {
    const { id: componentId, style } = comp

    const [styleState, setStyleState] = React.useState<StyleComponent>(style || {})

    const onChangeStyles = (styles: Partial<StyleComponent>) => {
        // Update state with deep merge
        setStyleState((prev) => {
            const merged = {
                ...prev,
                ...styles
            }
            return merged
        })
    }

    const resetStyles = (sectionKey: keyof StyleComponent) => {
        setStyleState((prev) => {
            const newState = { ...prev }
            delete newState[sectionKey]
            return newState
        })
    }

    useEffect(() => {
        if (componentId)
            onInteranctionsChange(componentId, {
                style: styleState
            })
    }, [styleState])

    const sections: StyleSection[] = [
        {
            id: 'layout',
            title: 'Layout',
            icon: <Layout size={12} />,
            isOpen: true,
            component: LayoutSection
        },
        {
            id: 'spacing',
            title: 'Spacing',
            icon: <Move size={12} />,
            isOpen: false,
            component: SpacingSection
        },
        {
            id: 'size',
            title: 'Size',
            icon: <Box size={12} />,
            isOpen: false,
            component: SizeSection
        },
        {
            id: 'typography',
            title: 'Typography',
            icon: <Type size={12} />,
            isOpen: false,
            component: TypographySection
        },
        {
            id: 'backgrounds',
            title: 'Backgrounds',
            icon: <Palette size={12} />,
            isOpen: false,
            component: BackgroundsSection
        },
        {
            id: 'borders',
            title: 'Borders',
            icon: <SquareIcon size={12} />,
            isOpen: false,
            component: BordersSection
        },
        {
            id: 'position',
            title: 'Position',
            icon: <Layers size={12} />,
            isOpen: false,
            component: PositionSection
        },
        {
            id: 'effects',
            title: 'Effects',
            icon: <Settings2 size={12} />,
            isOpen: false,
            component: EffectsSection
        },
        {
            id: 'custom-properties',
            title: 'Custom Properties',
            icon: <Variable size={12} />,
            isOpen: false,
            component: CustomPropertiesSection
        }
    ]

    // Map section IDs to StyleComponent keys
    const sectionKeyMap: Record<string, keyof StyleComponent> = {
        layout: 'layout',
        spacing: 'spacing',
        size: 'size',
        typography: 'typography',
        backgrounds: 'backgrounds',
        borders: 'borders',
        position: 'position',
        effects: 'effects',
        'custom-properties': 'customProperties'
    }

    const classes = generateAllClasses(style)

    return (
        <div className="p-1.5">
            <IGRPAccordionPrimitive type="single" collapsible className="w-full">
                {sections.map((section) => (
                    <IGRPAccordionItemPrimitive key={section.id} value={section.id}>
                        <IGRPAccordionTriggerPrimitive
                            className="group"
                            iconName="ChevronDown"
                            showIcon
                            iconPlacement="end"
                        >
                            <div className="flex align-middle items-center gap-2">
                                {section.icon}
                                {section.title}
                                <IGRPButtonPrimitive
                                    asChild
                                    variant={'ghost'}
                                    size={'sm'}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const sectionKey = sectionKeyMap[section.id]
                                        if (sectionKey) {
                                            resetStyles(sectionKey)
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-5"
                                    title={`Reset ${section.title} styles`}
                                >
                                    <RotateCcw className="h-4" />
                                </IGRPButtonPrimitive>
                            </div>
                        </IGRPAccordionTriggerPrimitive>
                        <IGRPAccordionContentPrimitive>
                            <section.component
                                onChangeStyles={onChangeStyles}
                                styles={styleState}
                                resetStyles={resetStyles}
                            />
                        </IGRPAccordionContentPrimitive>
                    </IGRPAccordionItemPrimitive>
                ))}
            </IGRPAccordionPrimitive>

            {/* Style Class Info */}
            {classes && (
                <>
                    <p className="text-sm text-muted-foreground pb-2">
                        These classes are generated by the style editor and applied to the current
                        component. You can use them to control visibility, layout, or other
                        behaviors dynamically.
                    </p>

                    <code className="block text-xs mt-1 bg-background p-2 rounded-sm border">
                        {classes}
                    </code>
                </>
            )}
        </div>
    )
}
