'use client';

import { useState, useEffect } from 'react';
import {
    Wifi,
    WifiOff,
    HelpCircle,
    AlertCircle,
    Stethoscope,
} from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { Separator } from '@renderer/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { DebugTerminal } from '@renderer/components/debug-terminal';
import Doctor from '@renderer/components/doctor';

export function Footer() {
    const [isOnline, setIsOnline] = useState(true);
    const [appVersion, setAppVersion] = useState('');
    const [newVersion, setNewVersion] = useState<string>('');
    const [open, setOpen] = useState<boolean>(false);
    const [log, setLog] = useState<string>('');
    const { t } = useTranslation();

    // Monitor online status
    useEffect(() => {
        const handleOnlineStatus = () => {
            setIsOnline(navigator.onLine);
        };

        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);

        // Initial check
        handleOnlineStatus();

        return () => {
            window.removeEventListener('online', handleOnlineStatus);
            window.removeEventListener('offline', handleOnlineStatus);
        };
    }, []);

    useEffect(() => {
        const handleLog = (_event: any, message: string) => {
            setLog(message);
        };

        window.electron.ipcRenderer.on('message-update', handleLog);

        return () => {
            window.electron.ipcRenderer.on(
                'message-update',
                handleLog
            );
        };
    }, []);

    useEffect(() => {
        // Fetch app version from Electron
        if (window.electron && window.electron.getAppVersion) {
            window.electron.getAppVersion().then((version: string) => {
                setAppVersion(version);
            });
        }
    }, []);

    useEffect(() => {
        const handleCheckUpdate = async () => {
            try {
                await window.electron
                    .checkForUpdates()
                    .then((version: string) => {
                        if (!version) return;
                        setNewVersion(version);
                        if (version !== appVersion) {
                            setLog(t('versionAvailable', { version }));
                        } else {
                            setLog('');
                        }
                    });
            } catch (error) {
                console.error('Error checking for updates:', error);
            }
        };
        if (appVersion) handleCheckUpdate();
    }, [appVersion, t]);

    return (
        <TooltipProvider>
            <footer className="h-8 border-t bg-card flex items-center px-3 justify-between text-xs fixed bottom-0 left-0 right-0 z-50">
                <div className="flex items-center space-x-3">
                    <span className="text-muted-foreground whitespace-nowrap flex-none">
                        {`${import.meta.env.VITE_APP_TITLE}`} &copy;{' '}
                        {new Date().getFullYear()}
                    </span>

                    <span className="text-muted-foreground">
                        {newVersion === appVersion ? (
                            `v${appVersion}`
                        ) : (
                            <span className="flex items-center space-x-1 text-amber-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="truncate max-w-[calc(100vw_-_500px)]">{log}</span>
                            </span>
                        )}
                    </span>
                </div>

                <div className="flex items-center space-x-3">
                    <Separator orientation="vertical" className="h-4" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size={'icon'}
                                variant={'ghost'}
                                className="h-6 w-6"
                                onClick={() => setOpen(!open)}
                            >
                                <Stethoscope className='text-muted-foreground'/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Doctor</TooltipContent>
                    </Tooltip>

                    <DebugTerminal />

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
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                            >
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
    );
}
