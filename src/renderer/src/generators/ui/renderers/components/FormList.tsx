import { Button } from '@renderer/components/ui/button'
import { IGRPBadge } from '@igrp/igrp-framework-react-design-system'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { Plus } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDroppedComponents } from '../../contexts/EditorContext'
import { useComponents } from '../../hooks/useComponents'
import useCustomCode from '../../hooks/useCustomCode'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'
import { ComputeLabelConfigPopover } from './ComputeLabelConfigPopover'

const IGRPStudioFormList: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const [selectedComputeLabel, setSelectedComputeLabel] = useState<string | null>(null)
    const [selectedComputeLabelFunction, setSelectedComputeLabelFunction] = useState<string | null>(
        null
    )

    const { id: componentId, componentName: parentComponentName, properties } = comp

    const { addButtonLabel, badgeValue, label, description, computeLabel } = properties || {}

    const { setEditingComponent, handleUpdateChildComponent } = useDroppedComponents()
    const { extractValidFields } = useComponents()
    const { functionOptions } = useCustomCode()

    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component })
        },
        [setEditingComponent]
    )

    useEffect(() => {
        if (computeLabel?.code) {
            const code = computeLabel.code

            // Check if it's a field pattern: ${item.fieldName}
            const fieldMatch = code.match(/^\$\{item\.(.+)\}$/)
            if (fieldMatch) {
                setSelectedComputeLabel(fieldMatch[1])
                setSelectedComputeLabelFunction(null)
                return
            }

            // Check if it's a function pattern: ${functionName(item ,index)}
            const functionMatch = code.match(/^\$\{(.+)\(item\s*,\s*index\)\}$/)
            if (functionMatch) {
                setSelectedComputeLabelFunction(functionMatch[1])
                setSelectedComputeLabel(null)
                return
            }

            // If no pattern matches, set the code as is (fallback)
            setSelectedComputeLabel(code)
            setSelectedComputeLabelFunction(null)
        }
    }, [computeLabel])

    // ⚡ Performance: Cache extracted fields with useMemo
    const { fields } = useMemo(() => {
        return extractValidFields(comp.children)
    }, [comp.children, extractValidFields])

    const handleConfigureField = useCallback(
        (value: string) => {
            setSelectedComputeLabel(value)
            setSelectedComputeLabelFunction(null) // Clear function selection

            const computLabel = `item.${value}`

            handleUpdateChildComponent(componentId, {
                properties: {
                    ...comp.properties,
                    computeLabel: {
                        code: '${' + computLabel + '}'
                    }
                }
            })
        },
        [comp.properties, componentId, handleUpdateChildComponent]
    )

    const handleConfigureFunction = useCallback(
        (value: string) => {
            setSelectedComputeLabelFunction(value)
            setSelectedComputeLabel(null) // Clear field selection

            handleUpdateChildComponent(componentId, {
                properties: {
                    ...comp.properties,
                    computeLabel: {
                        code: '${' + value + '(item ,index)}'
                    }
                }
            })
        },
        [comp.properties, componentId, handleUpdateChildComponent]
    )

    const renderChildComp = useCallback(
        (component: StructuredComponent) => {
            const { children: childComponents } = component
            const path = parentComponentName

            return (
                <div className="space-y-1">
                    <div className="flex flex-1 justify-between">
                        <div className="flex flex-row items-center gap-2">
                            <div>
                                <p className="text-sm font-medium">{label}</p>
                                <p className="text-xs">{description}</p>
                            </div>

                            {/* Compute Label Configuration Popover */}
                            <ComputeLabelConfigPopover
                                fields={fields}
                                functionOptions={functionOptions}
                                selectedComputeLabel={selectedComputeLabel}
                                selectedComputeLabelFunction={selectedComputeLabelFunction}
                                onConfigureField={handleConfigureField}
                                onConfigureFunction={handleConfigureFunction}
                            />
                        </div>
                        <IGRPBadge variant="outline" className="font-normal text-xs">
                            {badgeValue || 'nobadge'}
                        </IGRPBadge>
                    </div>
                    <Droppable component={component} onDrop={onDragEnd} className="border">
                        {(childComponents ?? []).map((child, index) => {
                            return (
                                <Draggable
                                    key={child.id}
                                    item={child}
                                    index={index}
                                    mode="MOVE"
                                    layout="horizontal"
                                    dropTargetId={componentId}
                                >
                                    <BoxWrapper
                                        parentComp={comp}
                                        comp={child}
                                        onEdit={() => handleEdit(child, path)}
                                        group="group/formlist"
                                        className="opacity-0 group-hover/formlist:opacity-100"
                                    >
                                        <CardComponent comp={child} onDragEnd={onDragEnd} />
                                    </BoxWrapper>
                                </Draggable>
                            )
                        })}
                    </Droppable>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void 0}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {addButtonLabel || 'Add'}
                    </Button>
                </div>
            )
        },
        [
            parentComponentName,
            label,
            description,
            badgeValue,
            onDragEnd,
            addButtonLabel,
            componentId,
            comp,
            handleEdit,
            fields,
            functionOptions,
            selectedComputeLabel,
            selectedComputeLabelFunction,
            handleConfigureField,
            handleConfigureFunction
        ]
    )

    return <>{renderChildComp(comp)}</>
}

export default IGRPStudioFormList
