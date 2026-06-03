import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { getLabel } from '@renderer/utils'
import { ArrowRight, ChevronRight } from 'lucide-react'
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

    const { title, content } = properties || {}

    const { setEditingComponent } = useDroppedComponents()

    const handleEditClick = (component: StructuredComponent, componentName: string) => {
        setEditingComponent({
            path: componentName,
            component
        })
    }

    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId)
    }

    const renderContent = () => {
        return components.map((child: StructuredComponent, index: number) => {
            const { properties } = child
            const { title, label, iconProperties, ...rest } = properties || {}
            const { icon: Icon } = iconProperties || {}
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
                        index={index}
                        onEdit={() => handleEditClick(child, parentComponentName)}
                        group="group/tab-menu"
                        className={cn(
                            'left-0 right-auto opacity-0 group-hover/tab-menu:opacity-100'
                        )}
                    >
                        <button
                            {...rest}
                            key={child.id}
                            type="button"
                            onClick={() => scrollToSection(child.id)}
                            className={cn(
                                'flex items-center justify-between w-full py-2.5 px-4 text-sm text-left transition-colors',
                                activeSection === child.id
                                    ? 'bg-primary/5 text-primary font-medium'
                                    : 'hover:bg-muted/30 text-muted-foreground'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {Icon ? <Icon className="h-4 w-4" /> : <ArrowRight />}
                                <span>{title || label}</span>
                            </div>
                            <ChevronRight
                                className={cn(
                                    'h-4 w-4 transition-colors',
                                    activeSection === child.id
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                )}
                            />
                        </button>
                    </BoxField>
                </Draggable>
            )
        })
    }

    return (
        <Droppable className={cn('p-0')} onDrop={onDragEnd} component={comp}>
            {components.length > 0 ? (
                <Card className="shadow-sm py-0 gap-0">
                    <CardHeader className="px-4  pt-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">{title}</CardTitle>
                            <Badge variant="outline" className="font-normal text-xs">
                                {content || 'New'}
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
