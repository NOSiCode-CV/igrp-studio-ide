'use client';

import { Bug } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IGRPButtonPrimitive, IGRPDrawerContentPrimitive, IGRPDrawerHeaderPrimitive, IGRPDrawerPrimitive, IGRPDrawerTitlePrimitive, IGRPDrawerTriggerPrimitive, IGRPScrollAreaPrimitive, IGRPTooltipContentPrimitive, IGRPTooltipPrimitive, IGRPTooltipTriggerPrimitive } from '@igrp/igrp-framework-react-design-system';

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
    const { t } = useTranslation();
    return (
        <IGRPDrawerPrimitive modal={false}>
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPDrawerTriggerPrimitive asChild>
                        <IGRPButtonPrimitive
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                        >
                            <Bug className="h-3.5 w-3.5 text-muted-foreground" />
                        </IGRPButtonPrimitive>
                    </IGRPDrawerTriggerPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>{t('debug')}</IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>
            <IGRPDrawerContentPrimitive
                aria-describedby={undefined}
                className="h-[40vh] z-40 mb-8"
            >
                <div className="flex h-full flex-col -mt-6">
                    <IGRPDrawerHeaderPrimitive className="p-0">
                        <IGRPDrawerTitlePrimitive />
                    </IGRPDrawerHeaderPrimitive>
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
                                {t('debug')}
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
            </IGRPDrawerContentPrimitive>
        </IGRPDrawerPrimitive>
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
    const { t } = useTranslation();

    return (
        <div className="h-full">
            <IGRPScrollAreaPrimitive className="h-full w-full" ref={scrollRef}>
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
                            {t('noConsoleLogs')}
                        </div>
                    )}
                </div>
            </IGRPScrollAreaPrimitive>
        </div>
    );
}
