import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { Play, StopCircle, Eye, MoreVertical } from 'lucide-react';
import { useTabs } from '@renderer/components/navigation/TabContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';

interface LogTerminalProps {
    basePath: string;
}
const { t } = useTranslation();

const PreviewMenu = ({ basePath }: LogTerminalProps) => {
    const { tabs, activeTab } = useTabs();

    // Função para iniciar o servidor Next.js
    const handleStart = () => {
        window.electron.ipcRenderer.send('start-nextjs', basePath);
    };

    // Função para parar o servidor Next.js
    const handleStop = () => {
        window.electron.ipcRenderer.send('stop-nextjs');
    };

    // Função para abrir a janela de preview
    const handlePreview = () => {
        const tab = tabs.filter((t) => t.id === activeTab);

        window.electron.ipcRenderer.send(
            'open-preview',
            tab[0].title.toLowerCase()
        );
    };

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <IGRPButtonPrimitive variant="secondary" size="sm">
                            <MoreVertical className="h-4 w-4" />
                        </IGRPButtonPrimitive>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('preview')}</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={handleStart}>
                    <Play className="h-4 w-4 mr-2" /> {t('startNext')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleStop}>
                    <StopCircle className="h-4 w-4 mr-2" /> {t('stopNext')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePreview}>
                    <Eye className="h-4 w-4 mr-2" /> {t('openPreview')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default PreviewMenu;
