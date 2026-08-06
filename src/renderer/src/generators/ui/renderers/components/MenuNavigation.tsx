import { IGRPIcon } from '@igrp/igrp-framework-react-design-system'
import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { getLabel } from '@renderer/utils'
import { ChevronRight } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { GenNoInfoComp } from '../../components/GenNoInfoComp'
import { useDroppedComponents } from '../../contexts/EditorContext'
import type { CardComponentProps } from '../CardComponent'
import BoxField from '../tools/BoxFields'

const IGRPStudioMenuNavigation: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd
}: CardComponentProps) => {
    const [activeSection, setActiveSection] = useState('basic')

    const {
        children: components,
        componentName: parentComponentName,
        properties,
        id: componentId
    } = comp

    const { title, badgeContent, showChevron = true, className } = properties || {}

    const { setEditingComponent } = useDroppedComponents()

    const handleEditClick = (component: StructuredComponent, path: string) => {
        setEditingComponent({
            path,
            component
        })
    }

    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId)
    }

    const renderContent = () => {
        return components.map((child: StructuredComponent, index: number) => {
            const { properties: childProperties } = child
            const { label, iconProperties, disabled } = childProperties || {}
            const iconName =
                typeof iconProperties?.icon === 'string' ? iconProperties.icon : 'ArrowRight'

            return (
                <Draggable
                    key={child.id}
                    item={child}
                    index={index}
                    dropTargetId={componentId}
                    dropZone={true}
                    className={cn('p-0 bg-muted/0')}
                    mode="MOVE"
                >
                    <BoxField
                        comp={child}
                        parentComp={comp}
                        path={parentComponentName}
                        index={index}
                        onEdit={() => handleEditClick(child, parentComponentName)}
                        group="group/tab-menu"
                        className={cn(
                            'left-0 right-auto opacity-0 group-hover/tab-menu:opacity-100'
                        )}
                    >
                        <button
                            type="button"
                            disabled={Boolean(disabled)}
                            onClick={() => scrollToSection(child.id)}
                            className={cn(
                                'flex items-center justify-between w-full py-2.5 px-4 text-sm text-left transition-colors',
                                activeSection === child.id
                                    ? 'bg-primary/5 text-primary font-medium'
                                    : 'hover:bg-muted/30 text-muted-foreground',
                                disabled && 'pointer-events-none opacity-50'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <IGRPIcon iconName={iconName} className="h-4 w-4" />
                                <span>{label || getLabel(child.componentName)}</span>
                            </div>
                            {showChevron && (
                                <ChevronRight
                                    className={cn(
                                        'h-4 w-4 transition-colors',
                                        activeSection === child.id
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                    )}
                                />
                            )}
                        </button>
                    </BoxField>
                </Draggable>
            )
        })
    }

    return (
        <Droppable className={cn('p-0', className)} onDrop={onDragEnd} component={comp}>
            {components.length > 0 ? (
                <Card className="shadow-sm py-0 gap-0">
                    <CardHeader className="px-4 pt-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                                {title || 'Menu'}
                            </CardTitle>
                            <Badge variant="outline" className="font-normal text-xs">
                                {badgeContent || '#'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 py-0">
                        <div className="divide-y">{renderContent()}</div>
                    </CardContent>
                </Card>
            ) : (
                <GenNoInfoComp type={getLabel(parentComponentName).toUpperCase()} />
            )}
        </Droppable>
    )
}

export default IGRPStudioMenuNavigation
