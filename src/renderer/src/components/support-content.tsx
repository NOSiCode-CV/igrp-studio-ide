'use client';

import { useTranslation } from 'react-i18next';
import {
    Headset,
} from 'lucide-react';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipProviderPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';

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
        icon: 'https://www.svgrepo.com/show/421616/email-mail-web.svg',
        iconClassName: 'hover:opacity-80',
    },
    {
        name: 'Github',
        href: 'https://github.com/NOSiCode-CV/igrp-studio-ide',
        icon: 'https://www.svgrepo.com/show/475654/github-color.svg',
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
        <IGRPTooltipProviderPrimitive>
            <div className="space-y-2 mb-4 rounded-lg p-2 shadow-lg border w-full">
                <div className="flex items-center gap-2">
                    <span className="h-6 w-6">
                        <Headset />
                    </span>
                    <h2 className="text-base font-semibold">{t('supportTitle')}</h2>
                </div>
                <div className="px-1">
                    <p className="text-muted-foreground">
                        {t('supportDescription')}
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                        {supportChannels.map((channel) => (
                            <IGRPTooltipPrimitive key={channel.name}>
                                <IGRPTooltipTriggerPrimitive asChild>
                                    <IGRPButtonPrimitive
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
                                            className="h-5 w-5"
                                        />
                                    </IGRPButtonPrimitive>
                                </IGRPTooltipTriggerPrimitive>
                                <IGRPTooltipContentPrimitive>
                                    {t('supportContactVia', { channel: channel.name })}
                                </IGRPTooltipContentPrimitive>
                            </IGRPTooltipPrimitive>
                        ))}
                    </div>
                </div>
            </div>
        </IGRPTooltipProviderPrimitive>
    );
}