import {
    IGRPButtonPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardPrimitive,
    IGRPContainer,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { OPTION_TYPE } from '@renderer/constants/appConstants'
import { KeyboardKey, SHORTCUTS } from '@renderer/constants/shortcut'
import { useKeyPress } from '@renderer/hooks/useKeyDown'
import { Database, FileCode, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const EmptyPage = ({ onClick }: { onClick: (option: string) => void }) => {
    const { t } = useTranslation()

    const actions = [
        {
            title: t('newObject', { name: t('model') }),
            icon: <Database className="h-6 w-6" />,
            onClick: () => onClick(OPTION_TYPE.MODEL),
            shortcut: SHORTCUTS.NEW_MODEL // Use a constante de atalho
        },
        {
            title: t('newObject', { name: t('controller') }),
            icon: <FileCode className="h-6 w-6" />,
            onClick: () => onClick(OPTION_TYPE.ACTION),
            shortcut: SHORTCUTS.NEW_CONTROLLER // Use a constante de atalho
        },
        {
            title: t('newDto'),
            icon: <FileText className="h-6 w-6" />,
            onClick: () => onClick(OPTION_TYPE.DATA_OBJECTS),
            shortcut: SHORTCUTS.NEW_DTO // Use a constante de atalho
        }
    ]

    useKeyPress(() => {
        onClick(OPTION_TYPE.MODEL)
    }, [KeyboardKey.model])

    useKeyPress(() => {
        onClick(OPTION_TYPE.ACTION)
    }, [KeyboardKey.endpoint])

    useKeyPress(() => {
        onClick(OPTION_TYPE.DATA_OBJECTS)
    }, [KeyboardKey.dto])

    return (
        <IGRPContainer className="mb-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {actions.map((action, key) => (
                    <IGRPCardPrimitive
                        key={key}
                        className="group hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={action.onClick}
                    >
                        <IGRPCardContentPrimitive className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                {action.icon}
                            </div>
                            <IGRPTooltipPrimitive>
                                <IGRPTooltipTriggerPrimitive asChild>
                                    <IGRPButtonPrimitive
                                        variant="default"
                                        className="w-full truncate"
                                    >
                                        <span className="block text-ellipsis overflow-hidden whitespace-nowrap">
                                            {action.title} ({action.shortcut})
                                        </span>
                                    </IGRPButtonPrimitive>
                                </IGRPTooltipTriggerPrimitive>
                                <IGRPTooltipContentPrimitive>
                                    {action.title} - {action.shortcut}
                                </IGRPTooltipContentPrimitive>
                            </IGRPTooltipPrimitive>
                        </IGRPCardContentPrimitive>
                    </IGRPCardPrimitive>
                ))}
            </div>
        </IGRPContainer>
    )
}

export default EmptyPage
