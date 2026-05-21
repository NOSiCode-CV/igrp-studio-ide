'use client'

import { Button } from '@renderer/components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from '@renderer/components/ui/drawer'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { Bug, Copy, Trash } from 'lucide-react'
import { type JSX, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IGRPTabs, IGRPTabsContent, IGRPTabsList, IGRPTabsTrigger } from './tabs'

interface ConsoleMessage {
    code: string
    message: string
    level?: 'info' | 'warn' | 'error' | 'debug' | 'success'
    timestamp?: string
    progress?: {
        current: number
        total: number
        label?: string
    }
}

export function DebugTerminal(): JSX.Element {
    const { t } = useTranslation()
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
                <TooltipContent>{t('debug')}</TooltipContent>
            </Tooltip>
            <DrawerContent aria-describedby={undefined} className="h-[40vh] z-40">
                <div className="flex h-full flex-col -mt-6">
                    <DrawerHeader className="p-0">
                        <DrawerTitle />
                    </DrawerHeader>
                    <IGRPTabs defaultValue="debug" className="flex h-full flex-col">
                        <IGRPTabsList>
                            <IGRPTabsTrigger
                                value="debug"
                                className="rounded-none data-[state=active]:border-b-1 data-[state=active]:border-primary data-[state=active]:shadow-none px-4"
                            >
                                <Bug className="h-4 w-4 mr-2" />
                                {t('debug')}
                            </IGRPTabsTrigger>
                        </IGRPTabsList>
                        <div className="flex-1 overflow-hidden min-h-0">
                            <IGRPTabsContent
                                value="debug"
                                className="h-full data-[state=active]:flex data-[state=active]:flex-col"
                            >
                                <TabConsole />
                            </IGRPTabsContent>
                        </div>
                    </IGRPTabs>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function TabConsole(): JSX.Element {
    const [logs, setLogs] = useState<ConsoleMessage[]>([])
    const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug' | 'success'>(
        'all'
    )
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleLog = (_event: unknown, log: ConsoleMessage): void => {
            setLogs((prevLogs) => {
                // Add timestamp if not provided
                const logWithTimestamp = {
                    ...log,
                    timestamp: log.timestamp || new Date().toISOString()
                }

                // Limit logs to 1000 entries to prevent memory issues
                const newLogs = [...prevLogs, logWithTimestamp]
                return newLogs.slice(-1000)
            })
        }

        window.electron.ipcRenderer.on('log', handleLog)

        return () => {
            window.electron.ipcRenderer.removeListener('log', handleLog)
        }
    }, [])

    const { t } = useTranslation()

    const getLogLevelColor = (level?: string): string => {
        switch (level) {
            case 'error':
                return 'text-red-500'
            case 'warn':
                return 'text-yellow-500'
            case 'success':
                return 'text-green-500'
            case 'debug':
                return 'text-blue-500'
            case 'info':
            default:
                return 'text-muted-foreground'
        }
    }

    const getLogLevelIcon = (level?: string): string => {
        switch (level) {
            case 'error':
                return '❌'
            case 'warn':
                return '⚠️'
            case 'success':
                return '✅'
            case 'debug':
                return '🐛'
            case 'info':
            default:
                return 'ℹ️'
        }
    }

    const filteredLogs = logs.filter((log) => filter === 'all' || log.level === filter)

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Filter and scroll controls */}
            <div className="flex gap-2 p-2 border-b">
                <select
                    value={filter}
                    onChange={(e) =>
                        setFilter(
                            e.target.value as
                                | 'all'
                                | 'info'
                                | 'warn'
                                | 'error'
                                | 'debug'
                                | 'success'
                        )
                    }
                    className="text-xs px-2 py-1 border rounded"
                >
                    <option value="all">All</option>
                    <option value="info">Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                    <option value="debug">Debug</option>
                    <option value="success">Success</option>
                </select>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLogs([])}
                    title="Clear all logs"
                    className="h-8 w-8"
                >
                    <Trash className="h-3.5 w-3.5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        navigator.clipboard.writeText(
                            filteredLogs.map((log) => log.message).join('\n')
                        )
                    }}
                    title="Copy logs to clipboard"
                    className="h-8 w-8"
                >
                    <Copy className="h-3.5 w-3.5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                        try {
                            await window.electron.ipcRenderer.invoke('docker-test-logging')
                        } catch (error) {
                            console.error('Failed to test logging:', error)
                        }
                    }}
                    title="Test Docker logging"
                    className="h-8 w-8"
                >
                    <Bug className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="flex-1 relative h-full min-h-0 mb-8">
                <ScrollArea className="h-full w-full">
                    <div
                        ref={scrollRef}
                        className="font-mono text-sm p-4 min-h-full overflow-y-auto scroll-smooth"
                        style={{
                            maxHeight: '100%',
                            height: '100%'
                        }}
                    >
                        {filteredLogs.length > 0 ? (
                            <div className="space-y-1">
                                {filteredLogs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`whitespace-pre-wrap border-l-2 pl-2 ${
                                            log.level === 'error'
                                                ? 'border-red-500 bg-red-50'
                                                : log.level === 'warn'
                                                  ? 'border-yellow-500 bg-yellow-50'
                                                  : log.level === 'success'
                                                    ? 'border-green-500 bg-green-50'
                                                    : log.level === 'debug'
                                                      ? 'border-blue-500 bg-blue-50'
                                                      : 'border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-xs mb-1">
                                            <span className={getLogLevelColor(log.level)}>
                                                {getLogLevelIcon(log.level)}
                                            </span>
                                            <span className="text-gray-500">
                                                {log.timestamp
                                                    ? new Date(log.timestamp).toLocaleTimeString()
                                                    : ''}
                                            </span>
                                            {log.level && (
                                                <span
                                                    className={`text-xs font-semibold ${getLogLevelColor(log.level)}`}
                                                >
                                                    {log.level.toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {log.progress && (
                                            <div className="mb-2">
                                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                    <span>{log.progress.label || 'Progress'}</span>
                                                    <span>
                                                        {log.progress.current}/{log.progress.total}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${(log.progress.current / log.progress.total) * 100}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className={getLogLevelColor(log.level)}>
                                            {log.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted-foreground">{t('noConsoleLogs')}</div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
