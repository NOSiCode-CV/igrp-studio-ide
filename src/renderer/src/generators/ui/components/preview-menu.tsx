import {
    IGRPButtonPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useTabs } from '@renderer/components/navigation/TabContext'
import { Eye, MoreVertical, Play, StopCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface LogTerminalProps {
    basePath: string
}
const { t } = useTranslation()

const PreviewMenu = ({ basePath }: LogTerminalProps) => {
    const { tabs, activeTab } = useTabs()

    // Função para iniciar o servidor Next.js
    const handleStart = () => {
        window.electron.ipcRenderer.send('start-nextjs', basePath)
    }

    // Função para parar o servidor Next.js
    const handleStop = () => {
        window.electron.ipcRenderer.send('stop-nextjs')
    }

    // Função para abrir a janela de preview
    const handlePreview = () => {
        const tab = tabs.filter((t) => t.id === activeTab)

        window.electron.ipcRenderer.send('open-preview', tab[0].title.toLowerCase())
    }

    return (
        <IGRPDropdownMenuPrimitive>
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPDropdownMenuTriggerPrimitive asChild>
                        <IGRPButtonPrimitive variant="secondary" size="sm">
                            <MoreVertical className="h-4 w-4" />
                        </IGRPButtonPrimitive>
                    </IGRPDropdownMenuTriggerPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>
                    <p>{t('preview')}</p>
                </IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>
            <IGRPDropdownMenuContentPrimitive>
                <IGRPDropdownMenuItemPrimitive onClick={handleStart}>
                    <Play className="h-4 w-4 mr-2" /> {t('startNext')}
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive onClick={handleStop}>
                    <StopCircle className="h-4 w-4 mr-2" /> {t('stopNext')}
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive onClick={handlePreview}>
                    <Eye className="h-4 w-4 mr-2" /> {t('openPreview')}
                </IGRPDropdownMenuItemPrimitive>
            </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
    )
}

export default PreviewMenu
