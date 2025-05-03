'use client';

import { Bug } from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@renderer/components/ui/drawer';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';
import { useEffect, useRef, useState } from 'react';
import {
    IGRPTabs,
    IGRPTabsContent,
    IGRPTabsList,
    IGRPTabsTrigger,
} from './tabs';

interface ConsoleMessage {
    code: string;
    message: string;
}

export function DebugTerminal() {
    return (
        <Drawer modal={false}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DrawerTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Bug className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </DrawerTrigger>
                </TooltipTrigger>
                <TooltipContent>Debug</TooltipContent>
            </Tooltip>
            <DrawerContent
                aria-describedby={undefined}
                className="h-[40vh] z-40 mb-8"
            >
                <div className="flex h-full flex-col -mt-6">
                    <DrawerHeader className="p-0">
                        <DrawerTitle />
                    </DrawerHeader>
                    <IGRPTabs
                        defaultValue="debug"
                        className="flex h-full flex-col"
                    >
                        <IGRPTabsList>
                            <IGRPTabsTrigger
                                value="debug"
                                className="rounded-none data-[state=active]:border-b-1 data-[state=active]:border-primary data-[state=active]:shadow-none px-4"
                            >
                                <Bug className="h-4 w-4 mr-2" />
                                Debug
                            </IGRPTabsTrigger>
                        </IGRPTabsList>
                        <div className="flex-1 overflow-hidden">
                            <IGRPTabsContent
                                value="debug"
                                className="h-full data-[state=active]:flex data-[state=active]:flex-col"
                            >
                                <ConsoleTab />
                            </IGRPTabsContent>
                        </div>
                    </IGRPTabs>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function ConsoleTab() {
    const [logs, setLogs] = useState<ConsoleMessage[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleLog = (_event: any, log: ConsoleMessage) => {
            setLogs((prevLogs) => {
                // Limit logs to 1000 entries to prevent memory issues
                const newLogs = [...prevLogs, log];
                return newLogs.slice(-1000);
            });
        };

        window.electron.ipcRenderer.on('log', handleLog);

        return () => {
            window.electron.ipcRenderer.removeListener('log', handleLog);
        };
    }, []);

    // Auto-scroll to bottom when logs change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [logs]);

    return (
        <div className="h-full">
            <ScrollArea className="h-full w-full" ref={scrollRef}>
                <div className="font-mono text-sm p-4  min-h-full">
                    {logs.length > 0 ? (
                        <pre className="text-sm">
                            {logs.map((log, index) => (
                                <div
                                    key={index}
                                    className="text-muted-foreground whitespace-pre-wrap"
                                >
                                    {log.message}
                                </div>
                            ))}
                        </pre>
                    ) : (
                        <div className="text-muted-foreground">
                            No console logs available
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
