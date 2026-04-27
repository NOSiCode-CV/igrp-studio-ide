import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { FileJson } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImportJsonSchemaModal } from '../../components/modals/import-json-schema-modal'
import { useDroppedComponents } from '../../contexts/EditorContext'
import { formVariants } from '../../utils/layout-mapping'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'

const IGRPStudioForm: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const { id: componentId, properties, children } = comp
    const { className, variant } = properties || {}
    const { t } = useTranslation()

    const { setEditingComponent, handleUpdateChildComponent } = useDroppedComponents()
    const [showImport, setShowImport] = useState(false)

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component
        })
    }

    const handleImport = (
        importedChildren: StructuredComponent[],
        mode: 'replace' | 'append'
    ): void => {
        const next =
            mode === 'append' ? [...(children ?? []), ...importedChildren] : importedChildren
        handleUpdateChildComponent(componentId, { children: next })
    }

    const renderFields = () => {
        return children.map((c: StructuredComponent, index: number) => {
            return (
                <Draggable
                    key={c.id}
                    item={c}
                    index={index}
                    dropTargetId={componentId}
                    className="p-1"
                    mode="MOVE"
                >
                    <BoxWrapper
                        comp={c}
                        onEdit={() => handleEditClick(c)}
                        group="group/comp-form"
                        className="opacity-0 group-hover/comp-form:opacity-100"
                    >
                        <CardComponent comp={c} onDragEnd={onDragEnd} />
                    </BoxWrapper>
                </Draggable>
            )
        })
    }

    return (
        <>
            <Droppable
                component={comp}
                onDrop={onDragEnd}
                className={cn(formVariants({ variant, className }), 'group/form relative')}
            >
                {renderFields()}

                <IGRPButtonPrimitive
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowImport(true)
                    }}
                    className={cn(
                        'absolute top-2 right-2 gap-1.5 z-10 transition-opacity',
                        children?.length
                            ? 'opacity-0 group-hover/form:opacity-100'
                            : 'opacity-100'
                    )}
                >
                    <FileJson className="h-3.5 w-3.5" />
                    {t('import_schema_button')}
                </IGRPButtonPrimitive>
            </Droppable>

            <ImportJsonSchemaModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                onConfirm={handleImport}
                existingChildrenCount={children?.length ?? 0}
            />
        </>
    )
}

export default IGRPStudioForm
