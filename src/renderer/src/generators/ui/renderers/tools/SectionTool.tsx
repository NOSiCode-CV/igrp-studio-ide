import {
    IGRPButtonPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface RowOptionsProps {
    onClickAddControl: (type: string) => void
    onClickDeleteSection: () => void
    onEdit: () => void
}

const SectionTool = ({ onClickAddControl }: RowOptionsProps) => {
    const { t } = useTranslation()
    return (
        <div id="row-tools">
            {/* Top-aligned button */}
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPButtonPrimitive
                        className="size-7 absolute left-1/2 transform -translate-x-1/2 top-[-20px] p-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 rounded-full z-50"
                        onClick={() => onClickAddControl('top')}
                    >
                        <Plus className="h-7 w-7" />
                    </IGRPButtonPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>
                    <p>{t('addNewRowTop')}</p>
                </IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>

            {/* Bottom-aligned button */}
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPButtonPrimitive
                        className="size-7 absolute left-1/2 transform -translate-x-1/2 bottom-[-15px] p-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 rounded-full z-50"
                        onClick={() => onClickAddControl('bottom')}
                    >
                        <Plus className="h-7 w-7" />
                    </IGRPButtonPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>
                    <p>{t('addNewRowBottom')}</p>
                </IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>
        </div>
    )
}

export default SectionTool
