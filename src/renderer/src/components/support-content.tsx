'use client';

import { useTranslation } from 'react-i18next';
import {
    Headset,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './ui/tooltip';
import { Button } from './ui/button';

export const supportChannels = [
    {
        name: 'IGRP',
        href: 'https://igrp.cv/',
        icon: 'https://igrp.cv/favicon.ico',
        iconClassName: 'hover:opacity-80',
    },
    {
        name: 'Discord',
        href: 'https://discord.com/invite/dywFBFaCQr',
        icon: 'https://www.svgrepo.com/show/331368/discord-v2.svg',
        iconClassName: 'hover:opacity-80',
    },
    {
        name: 'Youtube',
        href: 'https://www.youtube.com/@nosicode6503',
        icon: 'https://www.svgrepo.com/show/475700/youtube-color.svg',
        iconClassName: 'hover:opacity-80',
    },
    {
        name: 'Email',
        icon: 'https://www.svgrepo.com/show/521128/email-1.svg',
        iconClassName: 'hover:opacity-80',
    },
];

export interface SupportContentProps {
    onClose?: () => void;
}

export default function SupportContent({}: SupportContentProps) {
    const { t } = useTranslation();

    const handleClick = (url?: string) => {
        if (url) window.electron.ipcRenderer.send('open-external-url', url);
    };

    return (
        <TooltipProvider>
            <div className="space-y-2 mb-4 rounded-lg p-2 shadow-lg border w-full">
                <div className="flex items-center gap-2">
                    <span className="h-6 w-6">
                        <Headset />
                    </span>
                    <h2 className="text-lg font-semibold">{t('supportTitle')}</h2>
                </div>
                <div className="px-1">
                    <p className="text-muted-foreground">
                        {t('supportDescription')}
                    </p>
                    <div className="mt-4 flex justify-center gap-6">
                        {supportChannels.map((channel) => (
                            <Tooltip key={channel.name}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={'ghost'}
                                        size={'icon'}
                                        className={channel.iconClassName}
                                        aria-label={t('supportContactVia', { channel: channel.name })}
                                        onClick={() =>
                                            handleClick(channel?.href)
                                        }
                                    >
                                        <img
                                            src={
                                                channel.icon ||
                                                '/placeholder.svg'
                                            }
                                            alt={channel.name}
                                            className="h-6 w-6"
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t('supportContactVia', { channel: channel.name })}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}