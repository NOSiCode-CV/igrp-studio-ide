import React, { useState } from 'react';
import {
    Play,
    Square,
    Loader2,
    ChevronDown,
    Check,
    Trash2,
} from 'lucide-react';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';

interface DockerControlsProps {
    loading: boolean;
    onRun: () => Promise<void>;
    onStopAll: () => Promise<void>;
    onDropAll: () => Promise<void>;
    t: (key: string) => string;
}

const DockerControls: React.FC<DockerControlsProps> = ({
    loading,
    onRun,
    onStopAll,
    onDropAll,
    t,
}) => {

    const handleAction = async (action: () => Promise<void>) => {
        try {
            await action();
        } catch (error) {
            console.error('Action failed:', error);
        }
    };

    return (
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
                            handleAction(onRun);
                        }}
                    >
                        {loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-igrp" />
                        ) : (
                            <>
                                <Play className="h-3.5 w-3.5 text-igrp" />
                                <span className="font-medium ">{t('run')}</span>
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
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                        <ChevronDown className="h-3.5 w-3.5 text-igrp" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                        onClick={() => handleAction(onStopAll)}
                        className="group"
                    >
                        <Square className="h-3.5 w-3.5 mr-2 " />
                        <span className="font-medium">{t('stop')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => handleAction(onDropAll)}
                        className="group"
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-2 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                        <span className="font-medium">{t('delete')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default DockerControls;
