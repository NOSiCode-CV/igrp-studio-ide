import React, { useState } from 'react';
import { Play, Square, Loader2, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { TooltipProvider } from '@radix-ui/react-tooltip';

interface DockerControlsProps {
    loading: boolean;
    onRun: () => Promise<void>;
    onStopAll: () => Promise<void>;
    onDropAll: (dropVolume: boolean) => Promise<void>;
    t: (key: string) => string;
}

const DockerControls: React.FC<DockerControlsProps> = ({
    loading,
    onRun,
    onStopAll,
    onDropAll,
    t,
}) => {
    const [dropVolume, setDropVolume] = useState<boolean>(false);

    return (
        <TooltipProvider>
            <div className="flex items-center border rounded-md space-x-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`
              relative h-6 text-xs overflow-hidden group
              ${loading ? 'animate-pulse' : ''}
            `}
                    disabled={loading}
                >
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 
                          group-hover:translate-x-full -translate-x-full transition-transform duration-700"
                    />
                    <div className="flex items-center">
                        <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRun();
                            }}
                        >
                            {loading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-igrp" />
                            ) : (
                                <>
                                    <Play className="h-3.5 w-3.5 text-igrp" />
                                    <span className="font-medium ">
                                        {t('run')}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </Button>
                <Separator
                    orientation="vertical"
                    className="data-[orientation=vertical]:h-4"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                        >
                            <ChevronDown className="h-3.5 w-3.5 text-igrp" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                            onClick={() => onStopAll()}
                            className="group"
                        >
                            <Square className="h-3.5 w-3.5" />
                            <span className="font-medium">{t('stop')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={(e) => {
                                // Only handle the action if the click wasn't on the checkbox
                                if (
                                    !(e.target as HTMLElement).closest(
                                        '.checkbox-container'
                                    )
                                ) {
                                    onDropAll(dropVolume);
                                    setDropVolume(false);
                                }
                            }}
                            className="group"
                            asChild
                        >
                            <div className="flex flex-1 items-center justify-between">
                                <div className="flex flex-1 items-center">
                                    <Trash2 className="h-3.5 w-3.5 mr-2 text-destructive group-hover:scale-110 transition-transform duration-200" />
                                    <span className="font-medium">
                                        {t('delete')}
                                    </span>
                                </div>
                                <div
                                    className="checkbox-container"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Checkbox
                                                checked={dropVolume}
                                                onCheckedChange={(
                                                    checked: boolean
                                                ) => setDropVolume(checked)}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Delete containers and all
                                                Volumes
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </TooltipProvider>
    );
};

export default DockerControls;
