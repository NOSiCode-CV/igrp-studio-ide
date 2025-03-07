import { Button } from '@renderer/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Code, Eye, TvMinimal } from 'lucide-react';
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
    isDesign
}: NavigationBarProps) => {
    const { t } = useTranslation();

    /* const { tabs, activeTab } = useTabs();
    const [logs, setLogs] = useState<string[]>([]);
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

    const handleSaveClick = () => {
        onSave?.();
    };

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

    return (
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
            <Button
                color={isDesign ? 'primary' : 'light'}
                size="sm"
                onClick={onSwitch}
                className="hover:bg-igrp"
                title={isDesign ? 'Show Code' : 'Show Design'}
                variant={'ghost'}
            >
                {isDesign ? <Eye /> : <Code />}
            </Button>
            <Button
                size="sm"
                className="bg-igrp"
                onClick={handleSaveClick}
                title="Add Components to Page"
            >
                {t('save')}
            </Button>
        </div>
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
