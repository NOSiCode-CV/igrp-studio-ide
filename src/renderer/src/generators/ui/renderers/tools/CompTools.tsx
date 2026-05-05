import {
    IGRPBadgePrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipProviderPrimitive,
    IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import useStudio from '@renderer/hooks/use-studio'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { Copy, Move, Settings, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPONENT } from '../../ComponentTypes'
import { AddComponentPopover } from '../../components/add-components-popover'
import { BindingConfigurationModal } from '../../components/modals/binding-configuration-modal'
import StructureDropdown from '../../components/StructureDropdown'

interface ToolsProps {
    handleClickBtnEdition: () => void
    handleClickDeleteComp: () => void
    handleClickStructComp: (layout: string) => void
    handleClickCloneComp: () => void
    comp: StructuredComponent
    parentComp?: StructuredComponent
    path?: string
}

const CompTools = ({
    handleClickBtnEdition,
    handleClickDeleteComp,
    handleClickStructComp,
    handleClickCloneComp,
    comp,
    parentComp,
    path
}: ToolsProps) => {
    const { t } = useTranslation()
    const { componentName, label, allowTypes } = comp
    const { componentName: parentComponentName } = parentComp || {}

    const [isOpen, setIsOpen] = useState<boolean>(false)

    const isGrids = [COMPONENT.Columns].includes(componentName)

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([])
    const [deleteModal, setDeleteModal] = useState<boolean>(false)

    const [currentComponent, setCurrentComponent] = useState<StructuredComponent | null>(null)

    const { getAcceptedChildren } = useStudio()

    useEffect(() => {
        getAcceptedChildren(path || parentComponentName, componentName).then((data) => {
            setComponents(data)
        })
    }, [parentComponentName, componentName, getAcceptedChildren, path])

    useEffect(() => {
        if (!isOpen) {
            setCurrentComponent(null)
        }
    }, [isOpen, comp])

    return (
        <IGRPTooltipProviderPrimitive>
            <div className="flex justify-end shadow-lg align-middle py-0.5 space-x-0.5 z-50">
                <div className="flex align-middle items-center">
                    <span className="text-xs">{label || componentName}</span>
                </div>

                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <button className="container-mover cursor-pointer p-1 hover:bg-white hover:text-black rounded">
                            <Move className="h-4" />
                        </button>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('move')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>

                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <button
                            className="container-clone cursor-pointer p-1 hover:bg-white hover:text-black rounded"
                            onClick={handleClickCloneComp}
                        >
                            <Copy className="h-4" />
                        </button>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('clone')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>

                {isGrids && <StructureDropdown onClickStructure={handleClickStructComp} />}
                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <button
                            className="cursor-pointer p-1 hover:bg-white hover:text-black rounded"
                            onClick={handleClickBtnEdition}
                        >
                            <Settings className="h-4" />
                        </button>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('edit')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>

                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <button
                            className="container-remove cursor-pointer p-1 hover:bg-white hover:text-black rounded"
                            onClick={() => setDeleteModal(true)}
                        >
                            <Trash className="h-4" />
                        </button>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('delete')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>

                {components.length > 0 && (
                    <AddComponentPopover components={components} comp={comp} />
                )}

                {allowTypes && (
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
                                    <span className="text-xs">Binding Config</span>
                                </IGRPBadgePrimitive>
                            </IGRPTooltipTriggerPrimitive>
                            <IGRPTooltipContentPrimitive>
                                <p>Binding Configuration</p>
                            </IGRPTooltipContentPrimitive>
                        </IGRPTooltipPrimitive>

                        {currentComponent && (
                            <BindingConfigurationModal
                                comp={currentComponent}
                                path={''}
                                open={isOpen}
                                setOpen={setIsOpen}
                            />
                        )}
                    </>
                )}
            </div>

            <AlertDialogDelete
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleClickDeleteComp}
                hasTrigger={false}
                recordId={componentName}
            />
        </IGRPTooltipProviderPrimitive>
    )
}

export default CompTools
