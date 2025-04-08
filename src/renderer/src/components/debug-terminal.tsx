'use client';

import { Terminal } from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@renderer/components/ui/drawer';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useEffect, useRef, useState } from 'react';

export function DebugTerminal() {
    return (
        <Drawer modal={false}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DrawerTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </DrawerTrigger>
                </TooltipTrigger>
                <TooltipContent>Debug</TooltipContent>
            </Tooltip>
            <DrawerContent
                aria-describedby={undefined}
                className="min-h-40 z-40 !max-h-[40vh] rounded-t-lg border-t"
            >
                <div className="mx-auto w-full -mt-6">
                    <DrawerHeader className="p-0">
                        <DrawerTitle />
                    </DrawerHeader>
                    <Tabs defaultValue="debug" className="h-full flex flex-col">
                        <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
                            <TabsTrigger
                                value="debug"
                                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4"
                            >
                                <Terminal className="h-4 w-4 mr-2" />
                                Debug
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent 
                            value="debug" 
                            className="flex-1 m-0 p-0"
                        >
                            <ConsoleTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function ConsoleTab() {
    const [logs, setLogs] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleLog = (_event: any, message: string) => {
            setLogs((prevLogs) => {
                // Limit logs to 1000 entries to prevent memory issues
                const newLogs = [...prevLogs, message];
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
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <ScrollArea className="h-[calc(40vh-40px)]" ref={scrollRef}>
            <div className="p-3 font-mono text-sm">
                {logs.length > 0 ? (
                    <pre className="text-sm">
                        {logs.map((log, index) => (
                            <div key={index} className="text-gray-600">
                                {log}
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
    );
}
