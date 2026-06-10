'use client'

import { Button } from '@renderer/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system'
import { DebugTerminal } from '@renderer/components/debug-terminal'
import { TERMINAL_TOGGLE_EVENT } from '@renderer/components/integrated-terminal'
import Doctor from '@renderer/components/doctor'
import { SHOW_UPDATE_MODAL_EVENT } from '@renderer/components/update-banner'
import { captureRendererException } from '@renderer/init-sentry'
import { AlertCircle, HelpCircle, Stethoscope, Terminal, Wifi, WifiOff } from 'lucide-react'
import { type JSX, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface UpdateMessage {
    type: 'checking' | 'available' | 'not-available' | 'error' | 'progress' | 'downloaded'
    message: string
    version?: string
    error?: string
}

export function Footer(): JSX.Element {
    const [isOnline, setIsOnline] = useState(true)
    const [appVersion, setAppVersion] = useState('')
    const [newVersion, setNewVersion] = useState<string>('')
    const [open, setOpen] = useState<boolean>(false)
    const [lastUpdateType, setLastUpdateType] = useState<UpdateMessage['type'] | null>(null)
    const [log, setLog] = useState<string>('')
    const [updateError, setUpdateError] = useState<string>('')
    const { t } = useTranslation()

    // Monitor online status
    useEffect(() => {
        const handleOnlineStatus = (): void => {
            setIsOnline(navigator.onLine)
        }

        window.addEventListener('online', handleOnlineStatus)
        window.addEventListener('offline', handleOnlineStatus)

        // Initial check
        handleOnlineStatus()

        return () => {
            window.removeEventListener('online', handleOnlineStatus)
            window.removeEventListener('offline', handleOnlineStatus)
        }
    }, [])

    useEffect(() => {
        const handleUpdateMessage = (
            _event: Electron.IpcRendererEvent,
            data: UpdateMessage
        ): void => {
            setLastUpdateType(data.type)
            setLog(data.message)
            setUpdateError(data.error ?? '')
            if (data.version) setNewVersion(data.version)
        }

        window.electron.ipcRenderer.on('message-update', handleUpdateMessage)

        return () => {
            window.electron.ipcRenderer.removeListener('message-update', handleUpdateMessage)
        }
    }, [])

    useEffect(() => {
        // Fetch app version from Electron
        window.electron
            .getAppVersion?.()
            .then((version: string) => {
                setAppVersion(version)
            })
            .catch((err: Error) => console.error('Failed to get app version:', err))
    }, [])

    useEffect(() => {
        const handleCheckUpdate = async (): Promise<void> => {
            try {
                await window.electron.checkForUpdates?.().then((version: string) => {
                    if (!version) return
                    setNewVersion(version)
                    if (version !== appVersion) {
                        setLastUpdateType('available')
                        setLog(t('versionAvailable', { version }))
                    } else {
                        setLastUpdateType('not-available')
                        setLog('')
                    }
                })
            } catch (error) {
                console.error('Error checking for updates:', error)
                setLastUpdateType('error')
                setUpdateError(error instanceof Error ? error.message : String(error))
            }
        }
        if (appVersion) handleCheckUpdate()
    }, [appVersion, t])

    /** Dev-only: exercise GlitchTip/Sentry (renderer SDK + main via IPC). */
    const runMonitoringTestError = (): void => {
        const error = new Error('IGRP Studio: monitoring test (footer, simulated)')
        error.name = 'MonitoringTestError'

        captureRendererException(error, {
            source: 'footer-monitoring-test',
            simulated: true
        })

        if (window.electron?.reportError) {
            window.electron.reportError(error)
            setLog(t('monitoringTestSent'))
        } else {
            setLog(t('monitoringTestNoBridge'))
            console.warn('[Monitoring test] window.electron.reportError not available')
        }
    }

    return (
        <TooltipProvider>
            <footer className="h-8 border-t bg-card flex items-center px-3 justify-between text-xs fixed bottom-0 left-0 right-0 z-50">
                <div className="flex items-center space-x-3">
                    <span className="text-muted-foreground whitespace-nowrap flex-none">
                        {`${import.meta.env.VITE_APP_TITLE}`} &copy; {new Date().getFullYear()}
                    </span>

                    <span className="text-muted-foreground">
                        {lastUpdateType === 'error' ? (
                            <span
                                className="flex items-center space-x-1 text-destructive"
                                title={updateError || log}
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span className="truncate max-w-[calc(100vw-500px)]">
                                    {updateError || log}
                                </span>
                            </span>
                        ) : lastUpdateType === 'available' ||
                          lastUpdateType === 'progress' ||
                          lastUpdateType === 'downloaded' ? (
                            <button
                                type="button"
                                onClick={() =>
                                    window.dispatchEvent(new CustomEvent(SHOW_UPDATE_MODAL_EVENT))
                                }
                                className="flex items-center space-x-1 text-amber-600 hover:text-amber-700 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                                title={
                                    newVersion
                                        ? `${t('new_update_available')} (${newVersion})`
                                        : t('new_update_available')
                                }
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span className="truncate max-w-[calc(100vw-500px)]">{log}</span>
                            </button>
                        ) : lastUpdateType === 'checking' ? (
                            <span className="flex items-center space-x-1 text-muted-foreground">
                                <span className="truncate max-w-[calc(100vw-500px)]">{log}</span>
                            </span>
                        ) : (
                            `v${appVersion}`
                        )}
                    </span>
                </div>

                <div className="flex items-center space-x-3">
                    <IGRPSeparator orientation="vertical" className="h-4" />

                    {import.meta.env.DEV ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={runMonitoringTestError}
                                >
                                    {t('monitoringTestButton')}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p className="max-w-xs">{t('monitoringTestTooltip')}</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : null}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size={'icon'}
                                variant={'ghost'}
                                className="h-6 w-6"
                                onClick={() => setOpen(!open)}
                            >
                                <Stethoscope className="text-muted-foreground" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Doctor</TooltipContent>
                    </Tooltip>

                    <DebugTerminal />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                    window.dispatchEvent(new Event(TERMINAL_TOGGLE_EVENT))
                                }
                            >
                                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Terminal (Ctrl+`)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center space-x-1">
                                {isOnline ? (
                                    <Wifi className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                    <WifiOff className="h-3.5 w-3.5 text-destructive" />
                                )}
                                <span className="text-muted-foreground">
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{t('networkStatus')}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{t('helpCenter')}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Doctor open={open} setOpen={setOpen} />
                </div>
            </footer>
        </TooltipProvider>
    )
}
