import { ScrollArea, ScrollBar } from '@renderer/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { Play, StopCircle, Eye, Terminal } from 'lucide-react';
import { useTabs } from '@renderer/components/navigation/TabContext';

interface LogTerminalProps {
    basePath: string;
}

const LogTerminal = ({ basePath }: LogTerminalProps) => {
    const [logs, setLogs] = useState<string[]>([]);
    const { tabs, activeTab } = useTabs();

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
        <div className="space-y-4 p-4">
            {/* Botões para Start, Stop e Preview com ícones e tooltips */}
            <div className="flex space-x-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={handleStart}
                            variant="outline"
                            size="icon"
                        >
                            <Play className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Iniciar Next.js</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={handleStop}
                            variant="outline"
                            size="icon"
                        >
                            <StopCircle className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Parar Next.js</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={handlePreview}
                            variant="outline"
                            size="icon"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Abrir Preview</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setLogs([])}
                        >
                            <Terminal className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Limpar Logs</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Área de logs */}
            {logs && logs.length > 0 && (
                <>
                    <h3 className="text-xs font-semibold mb-2">
                        Logs do Servidor Next.js
                    </h3>
                    <ScrollArea className="w-full rounded-md border p-2 bg-white">
                        <pre className="text-sm whitespace-pre-wrap text-wrap">
                            {logs.map((log, index) => (
                                <div
                                    key={index}
                                    className="text-gray-800"
                                >
                                    {log}
                                </div>
                            ))}
                        </pre>
                        <ScrollBar orientation="horizontal" className="h-2" />
                    </ScrollArea>
                </>
            )}
        </div>
    );
};

export default LogTerminal;