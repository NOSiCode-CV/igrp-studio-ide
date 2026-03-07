import {
    IGRPButtonPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipProviderPrimitive,
    IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { APRESENTATION } from '@renderer/constants/appConstants'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface NavigationBarProps {
    activePresentation: string
    onSwitch: (activePresentation: string) => void
    onSave?: () => Promise<void>
    basePath: string
    page: string
}

const NavigationBar = ({
    onSwitch,
    onSave,
    activePresentation
}: NavigationBarProps): React.JSX.Element => {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSaveClick = async (): Promise<void> => {
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            await onSave?.()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <IGRPTooltipProviderPrimitive>
            <div className="flex flex-1 justify-end items-center space-x-2">
                <div className="relative flex rounded-lg border bg-muted p-0.5 text-sm space-x-2">
                    <IGRPButtonPrimitive
                        size="sm"
                        variant={activePresentation === APRESENTATION.CODE ? 'outline' : 'ghost'}
                        onClick={() => onSwitch(APRESENTATION.CODE)}
                        className="h-7"
                    >
                        Code
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        size="sm"
                        onClick={() => onSwitch(APRESENTATION.DESIGN)}
                        variant={activePresentation === APRESENTATION.DESIGN ? 'outline' : 'ghost'}
                        className="h-7"
                    >
                        Design
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        size="sm"
                        onClick={() => onSwitch(APRESENTATION.JSON)}
                        variant={activePresentation === APRESENTATION.JSON ? 'outline' : 'ghost'}
                        className="h-7"
                    >
                        Json
                    </IGRPButtonPrimitive>
                </div>
                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <IGRPButtonPrimitive
                            size="sm"
                            onClick={handleSaveClick}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? t('saving') : t('save')}
                        </IGRPButtonPrimitive>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        {'Add Components to Page'}
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
            </div>
        </IGRPTooltipProviderPrimitive>
    )
}

export default NavigationBar
