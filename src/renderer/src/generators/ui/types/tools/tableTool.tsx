import {
    IGRPBadgePrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import useStudio from '@renderer/hooks/use-studio'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { Settings, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddComponentPopover } from '../../components/add-components-popover'
import { BindingConfigurationFilterModal } from '../../components/binding-config-filter-modal'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'

interface RowOptionsProps {
    comp: StructuredComponent
    parentComp: StructuredComponent
    tableColumns?: StructuredComponent[]
    onEdit: () => void
    group?: string
    className?: string
    index?: number
}

const TableTool = ({
    comp,
    parentComp,
    tableColumns = [],
    onEdit,
    group,
    className,
    index = 0
}: RowOptionsProps): React.JSX.Element => {
    const { t } = useTranslation()

    const { id, componentName } = comp

    const [deleteModal, setDeleteModal] = useState<boolean>(false)

    const [isOpen, setIsOpen] = useState(false)

    const { componentName: parentComponentName } = parentComp || {}

    const [currentComponent, setCurrentComponent] = useState<StructuredComponent | null>(null)

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([])

    const { getAcceptedChildren } = useStudio()

    const { handleRemoveChildFromComponent } = useDroppedComponents()

    useEffect(() => {
        getAcceptedChildren(parentComponentName, componentName).then((data) => {
            setComponents(data)
        })
    }, [parentComponentName, componentName, getAcceptedChildren])

    const onClickDeleteField = (): void => {
        handleRemoveChildFromComponent({ droppableId: id, index })
    }

    return (
        <div className={cn('table-tools relative', group)}>
            {/* Action buttons */}
            <div
                className={cn(
                    'absolute px-1 z-10 left-4 -mt-3 rounded opacity-0 group-hover/table:opacity-100 transition-opacity duration-200 bg-gray-600 text-white',
                    className
                )}
            >
                <div className="flex justify-end shadow-lg align-middle space-x-1 z-50 py-0.5 ">
                    <div className="flex align-middle items-center">
                        <span className="text-xs">{comp.label || comp.componentName}</span>
                    </div>
                    <IGRPTooltipPrimitive>
                        <IGRPTooltipTriggerPrimitive asChild>
                            <button
                                className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
                                onClick={onEdit}
                            >
                                <Settings className="h-3.5" />
                            </button>
                        </IGRPTooltipTriggerPrimitive>
                        <IGRPTooltipContentPrimitive>
                            <p>{t('edit')}</p>
                        </IGRPTooltipContentPrimitive>
                    </IGRPTooltipPrimitive>

                    <IGRPTooltipPrimitive>
                        <IGRPTooltipTriggerPrimitive asChild>
                            <button
                                className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                                title="Delete"
                                onClick={() => setDeleteModal(true)}
                            >
                                <Trash className="h-3.5" />
                            </button>
                        </IGRPTooltipTriggerPrimitive>
                        <IGRPTooltipContentPrimitive>
                            <p>{t('delete')}</p>
                        </IGRPTooltipContentPrimitive>
                    </IGRPTooltipPrimitive>

                    <div className="space-x-1">
                        {components.length > 0 && (
                            <AddComponentPopover comp={comp} components={components} />
                        )}
                        {tableColumns.length > 0 && (
                            <>
                                <IGRPTooltipPrimitive>
                                    <IGRPTooltipTriggerPrimitive asChild>
                                        <IGRPBadgePrimitive
                                            variant={'default'}
                                            className="rounded-sm cursor-pointer h-6"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setCurrentComponent(comp)
                                                setIsOpen(true)
                                            }}
                                        >
                                            <span className="text-xs">Binding Filter</span>
                                        </IGRPBadgePrimitive>
                                    </IGRPTooltipTriggerPrimitive>
                                    <IGRPTooltipContentPrimitive>
                                        <p>Binding Filter Configuration </p>
                                    </IGRPTooltipContentPrimitive>
                                </IGRPTooltipPrimitive>

                                {isOpen && currentComponent && (
                                    <BindingConfigurationFilterModal
                                        open={isOpen}
                                        setOpen={setIsOpen}
                                        comp={currentComponent}
                                        tableColumns={tableColumns}
                                        path=""
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <AlertDialogDelete
                        isOpen={deleteModal}
                        onClose={() => setDeleteModal(false)}
                        onConfirm={onClickDeleteField}
                        hasTrigger={false}
                        recordId={componentName}
                    />
                </div>
            </div>
        </div>
    )
}

export default TableTool
