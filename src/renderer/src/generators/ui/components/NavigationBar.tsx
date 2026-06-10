import { Button } from '@renderer/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@renderer/components/ui/tooltip'
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
        <TooltipProvider>
            <div className="flex flex-1 justify-end items-center space-x-2">
                <div className="relative flex rounded-lg border bg-muted p-0.5 text-sm space-x-2">
                    <Button
                        size="sm"
                        variant={activePresentation === APRESENTATION.CODE ? 'outline' : 'ghost'}
                        onClick={() => onSwitch(APRESENTATION.CODE)}
                        className="h-7"
                    >
                        Code
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => onSwitch(APRESENTATION.DESIGN)}
                        variant={activePresentation === APRESENTATION.DESIGN ? 'outline' : 'ghost'}
                        className="h-7"
                    >
                        Design
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => onSwitch(APRESENTATION.TREE)}
                        variant={activePresentation === APRESENTATION.TREE ? 'outline' : 'ghost'}
                        className="h-7"
                        title="Tree view — drag from the palette, drop into the manifest tree"
                    >
                        Tree
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => onSwitch(APRESENTATION.JSON)}
                        variant={activePresentation === APRESENTATION.JSON ? 'outline' : 'ghost'}
                        className="h-7"
                    >
                        Json
                    </Button>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="sm" onClick={handleSaveClick} disabled={isSubmitting}>
                            {isSubmitting ? t('saving') : t('save')}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{'Add Components to Page'}</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}

export default NavigationBar
