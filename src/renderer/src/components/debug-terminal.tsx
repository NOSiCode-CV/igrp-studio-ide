'use client';

import { Bug } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPScrollAreaPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipTriggerPrimitive,
    IGRPTooltipContentPrimitive,
} from '@igrp/igrp-framework-react-design-system';
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
        <div>
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPButtonPrimitive variant="ghost" size="icon" className="h-6 w-6">
                        <Bug className="h-3.5 w-3.5 text-muted-foreground" />
                    </IGRPButtonPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>{t('debug')}</IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>
            <div
                aria-describedby={undefined}
                className="h-[40vh] z-40 mb-8"
            >
                <div className="flex h-full flex-col -mt-6">
                    <div className="p-0">
                        <div />
                    </div>
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
            </div>
        </div>
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
