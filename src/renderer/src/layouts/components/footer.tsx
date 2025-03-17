'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, HelpCircle, Terminal } from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { Separator } from '@renderer/components/ui/separator';
import { TerminalSimulator } from '@renderer/pages/terminal-simulator';

export function Footer() {
    const [isOnline, setIsOnline] = useState(true);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);

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

    const [appVersion, setAppVersion] = useState('');

    useEffect(() => {
        // Fetch app version from Electron
        if (window.electron && window.electron.getAppVersion) {
            window.electron.getAppVersion().then((version) => {
                setAppVersion(version);
            });
        }
    }, []);

    return (
        <footer className="h-8 border-t bg-card flex items-center px-3 justify-between text-xs fixed bottom-0 left-0 right-0">
            <div className="flex items-center space-x-3">
                <span className="text-muted-foreground">
                    {`${import.meta.env.VITE_APP_TITLE}`} &copy;{' '}
                    {new Date().getFullYear()}
                </span>

                <span className="text-muted-foreground">{`v${appVersion}`}</span>
            </div>

            <div className="flex items-center space-x-3">
                <Separator orientation="vertical" className="h-4" />

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setIsTerminalOpen(true)}
                            >
                                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>Open Terminal</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
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
                            <p>Network Status</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
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
                            <p>Help Center</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TerminalSimulator
                    isOpen={isTerminalOpen}
                    onClose={() => setIsTerminalOpen(false)}
                />
            </div>
        </footer>
    );
}
