import { TooltipProvider } from '@radix-ui/react-tooltip';
import { useTabs } from '@renderer/components/navigation/TabContext';
import { Button } from '@renderer/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { OPTION_TYPE } from '@renderer/constants/appConstants';
import { AppWindowMac, Code, Eye, TvMinimal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavigationBarProps {
    isDesign: boolean;
    onSwitch?: () => void;
    onSave?: () => void;
    basePath: string;
    page: string;
}

interface StudioDropdownProps {
    onStart: () => void;
    onPreview: () => void;
    onStop: () => void;
    onOpenLogs: () => void;
    logs: string[];
}

const NavigationBar = ({
    onSwitch,
    onSave,
    basePath,
    isDesign,
}: NavigationBarProps) => {
    const { t } = useTranslation();

    const { tabs, activeTab, initializeTabFromCurrentItem } = useTabs();
    /* const [logs, setLogs] = useState<string[]>([]);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    // Função para receber logs do processo principal
    useEffect(() => {
        const handleLog = (_event: any, message: string) => {
            setLogs((prevLogs) => [...prevLogs, message]);
        };

        window.electron.ipcRenderer.on('log', handleLog);

        return () => {
            window.electron.ipcRenderer.removeListener('log', handleLog);
        };
    }, []);

    useEffect(() => {
        if (logs.length > 0) {
            setIsLogModalOpen(true);
        }
    }, [logs]); */

    /*   const handleStart = () => {
        window.electron.ipcRenderer.send('start-nextjs', basePath);
    };

    const handlePreview = () => {
        const tab = tabs.filter((t) => t.id === activeTab);

        window.electron.ipcRenderer.send(
            'open-preview',
            tab[0].title.toLowerCase()
        );
    };

    const handleStop = () => {
        window.electron.ipcRenderer.send('stop-nextjs');
    };

    const handleOpenLogs = () => {
        setIsLogModalOpen(true); 
    }; */

    const handleSaveClick = () => {
        onSave?.();
    };

    const onClickSourceCode = () => {
        const tab = tabs.filter((t) => t.id === activeTab);

        console.log(tab);

        const page = tab[0];
        initializeTabFromCurrentItem({
            path: `${basePath}/src/app/pages/${page.item.label.toLowerCase()}/page.tsx`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${page.item.label}.tsx`,
        });
    };

    return (
        <TooltipProvider>
            <div className="flex justify-end items-center space-x-2 ">
                {/*<StudioDropdown
                onStart={handleStart}
                onPreview={handlePreview}
                onStop={handleStop}
                onOpenLogs={handleOpenLogs}
                logs={logs}
            />
             <LogModal
                logs={logs}
                isOpen={isLogModalOpen}
                onOpenChange={setIsLogModalOpen}
            /> */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            variant={'secondary'}
                            onClick={onClickSourceCode}
                        >
                            <AppWindowMac />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('sourceCode')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            color={isDesign ? 'primary' : 'light'}
                            size="sm"
                            onClick={onSwitch}
                            className="hover:bg-igrp"
                            variant={'ghost'}
                        >
                            {isDesign ? <Eye /> : <Code />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {isDesign ? 'Show Code [JSON]' : 'Show Design'}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            className="bg-igrp"
                            onClick={handleSaveClick}
                        >
                            {t('save')}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t('Add Components to Page')}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
};

const StudioDropdown = ({
    onStart,
    onPreview,
    onStop,
    onOpenLogs,
    logs,
}: StudioDropdownProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                    <TvMinimal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={onStart}>
                    Iniciar Next.js
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPreview}>
                    Abrir Preview
                </DropdownMenuItem>
                {logs && logs.length > 0 && (
                    <DropdownMenuItem onClick={onOpenLogs}>
                        Ver Logs
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onStop}>
                    Parar Next.js
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NavigationBar;
