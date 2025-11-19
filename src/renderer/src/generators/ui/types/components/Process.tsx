import React from 'react'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import { cn } from '@renderer/lib/utils'
import { StructuredComponent } from '@renderer/lib/dnd/types'
import Draggable from '@renderer/lib/dnd/Draggable'
import BoxWrapper from '../tools/BoxWrapper'
import Droppable from '@renderer/lib/dnd/Droppable'
import CardComponent, { CardComponentProps } from '../CardComponent'
import BoxField from '../tools/BoxFields'
import {
  IGRPTabsContentPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsPrimitive,
  IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'

const IGRPStudioProcess: React.FC<CardComponentProps> = ({
  comp,
  onDragEnd
}: CardComponentProps) => {
  const {
    children: components,
    componentName: parentComponentName,
    properties,
    id: componentId
  } = comp

  const { className } = properties || {}

  const { setEditingComponent } = useDroppedComponents()

  const handleEditClick = (component: StructuredComponent, componentName: string) => {
    setEditingComponent({
      path: componentName,
      component
    })
  }

  const renderTriggers = () => {
    //i want to break line when the trigger is too long
    return components.map((child: StructuredComponent, index: number) => {
      const { properties, componentName } = child

      const { className, name } = properties || {}

      return (
        <Draggable
          key={child.id}
          item={child}
          index={index}
          dropTargetId={componentId}
          dropZone={true}
          className={cn('p-0 bg-muted/0', className)}
          mode="MOVE"
          layout="horizontal"
        >
          <IGRPTabsTriggerPrimitive
            value={child.id}
            key={index}
            className="relative min-w-fit max-w-full flex-shrink-0 flex flex-wrap break-words h-auto min-h-[36px] px-3 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-primary border-2 border-primary transition-all duration-200 hover:scale-105 data-[state=active]:scale-110 data-[state=active]:shadow-2xl  data-[state=active]:py-2 data-[state=active]:px-4"
            asChild
          >
            <div className="relative">
              {/* Connecting line to next step */}
              {index < components.length - 1 && (
                <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-primary transform -translate-y-1/2 z-0" />
              )}
              {/* Connecting line from previous step */}
              {index > 0 && (
                <div className="absolute top-1/2 -left-4 w-8 h-0.5 bg-primary transform -translate-y-1/2 z-0" />
              )}
              <BoxField
                parentComp={comp}
                index={index}
                comp={child}
                onEdit={() => handleEditClick(child, parentComponentName)}
                group="group/tabitem-trigger"
                className={cn(
                  'opacity-0 group-hover/tabitem-trigger:opacity-100',
                  'data-[state=active]:opacity-100 right-0 left-auto'
                )}
              >
                <span className="text-xs font-medium">{name || componentName}</span>
              </BoxField>
            </div>
          </IGRPTabsTriggerPrimitive>
        </Draggable>
      )
    })
  }

  const renderContent = () => {
    return components.map((child: StructuredComponent, index: number) => {
      const { children: components, id: componentId } = child

      return (
        <IGRPTabsContentPrimitive value={child.id} key={index} asChild className="mt-4">
          <Droppable
            onDrop={onDragEnd}
            component={child}
            className="rounded-lg border border-dashed min-h-[200px]"
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
                      group="group/tab-content"
                      className={cn(
                        'left-0 right-auto opacity-0 group-hover/tab-content:opacity-100'
                      )}
                    >
                      <CardComponent comp={childTab} onDragEnd={onDragEnd} />
                    </BoxWrapper>
                  </Draggable>
                )
              })}
          </Droppable>
        </IGRPTabsContentPrimitive>
      )
    })
  }

  return (
    <Droppable
      className={cn('flex w-full flex-col gap-6', className)}
      onDrop={onDragEnd}
      component={comp}
    >
      {components.length > 0 && (
        <IGRPTabsPrimitive defaultValue={components[0].id} className="w-full">
          <IGRPTabsListPrimitive className="flex-wrap overflow-x-auto w-full h-auto min-h-[40px] gap-4 px-4 py-2 justify-center items-center">
            {renderTriggers()}
          </IGRPTabsListPrimitive>
          {renderContent()}
        </IGRPTabsPrimitive>
      )}
    </Droppable>
  )
}

export default IGRPStudioProcess
