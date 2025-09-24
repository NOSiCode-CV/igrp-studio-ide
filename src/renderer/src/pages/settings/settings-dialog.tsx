'use client';

import {
    Bell,
    Globe,
    Home,
    Keyboard,
    Link,
    Settings,
    Shirt,
} from 'lucide-react';
import {
    IGRPBreadcrumbPrimitive,
    IGRPBreadcrumbItemPrimitive,
    IGRPBreadcrumbLinkPrimitive,
    IGRPBreadcrumbListPrimitive,
    IGRPBreadcrumbPagePrimitive,
    IGRPBreadcrumbSeparatorPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPDialogPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPDialogTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPSidebarPrimitive,
    IGRPSidebarContentPrimitive,
    IGRPSidebarGroupPrimitive,
    IGRPSidebarGroupContentPrimitive,
    IGRPSidebarMenuPrimitive,
    IGRPSidebarMenuButtonPrimitive,
    IGRPSidebarMenuItemPrimitive,
    IGRPSidebarProviderPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { AboutSettings } from './about-settings';
import { LanguageSettings } from './language-settings';
import { ConnectedAccountsSettings } from './connected-accounts-settings';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPScrollAreaPrimitive } from '@igrp/igrp-framework-react-design-system';
import KeyboardShortcuts from './keyboard-shortcuts';
import { AppearanceSettings } from './appearance';

const data = {
    nav: [
        { name: 'about', icon: Home, component: AboutSettings },
        { name: 'language', icon: Globe, component: LanguageSettings },
        {
            name: 'connected_accounts',
            icon: Link,
            component: ConnectedAccountsSettings,
        },
        { name: 'notifications', icon: Bell },
        { name: 'appearance', icon: Shirt, component: AppearanceSettings },
        { name: 'shortcuts', icon: Keyboard, component: KeyboardShortcuts },
    ],
};

export function SettingsDialog() {
    const [activeItem, setActiveItem] = React.useState('about');
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPDialogTriggerPrimitive asChild>
                        <IGRPButtonPrimitive variant="ghost" size="sm">
                            <Settings className="w-5 h-5" />
                            <span className="sr-only">{t('settings')}</span>
                        </IGRPButtonPrimitive>
                    </IGRPDialogTriggerPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>{t('settings')}</IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>
            <IGRPDialogContentPrimitive className="overflow-hidden p-0 md:max-h-[500px] sm:max-w-[600px] md:max-w-[700px] max-w-4xl">
                <IGRPDialogHeaderPrimitive className="pb-3">
                    <IGRPDialogTitlePrimitive className="sr-only">
                        {t('settings')}
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive className="sr-only">
                       {t('customizeSettingsHere')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <IGRPSidebarProviderPrimitive className="items-start">
                    <IGRPSidebarPrimitive collapsible="none" className="hidden md:flex">
                        <IGRPSidebarContentPrimitive>
                            <IGRPSidebarGroupPrimitive>
                                <IGRPSidebarGroupContentPrimitive>
                                    <IGRPSidebarMenuPrimitive>
                                        {data.nav.map((item) => (
                                            <IGRPSidebarMenuItemPrimitive key={item.name}>
                                                <IGRPSidebarMenuButtonPrimitive
                                                    asChild
                                                    isActive={
                                                        item.name === activeItem
                                                    }
                                                    onClick={() =>
                                                        setActiveItem(item.name)
                                                    }
                                                >
                                                    <button>
                                                        <item.icon />
                                                        <span>
                                                            {t(item.name)}
                                                        </span>
                                                    </button>
                                                </IGRPSidebarMenuButtonPrimitive>
                                            </IGRPSidebarMenuItemPrimitive>
                                        ))}
                                    </IGRPSidebarMenuPrimitive>
                                </IGRPSidebarGroupContentPrimitive>
                            </IGRPSidebarGroupPrimitive>
                        </IGRPSidebarContentPrimitive>
                    </IGRPSidebarPrimitive>

                    <main className="flex h-[480px] flex-1 flex-col">
                        <IGRPScrollAreaPrimitive className='h-full'>
                            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                                <div className="flex items-center gap-2 px-4">
                                    <IGRPBreadcrumbPrimitive>
                                        <IGRPBreadcrumbListPrimitive>
                                            <IGRPBreadcrumbItemPrimitive className="hidden md:block">
                                                <IGRPBreadcrumbLinkPrimitive href="#/">
                                                    {t('settings')}
                                                </IGRPBreadcrumbLinkPrimitive>
                                            </IGRPBreadcrumbItemPrimitive>
                                            <IGRPBreadcrumbSeparatorPrimitive className="hidden md:block" />
                                            <IGRPBreadcrumbItemPrimitive>
                                                <IGRPBreadcrumbPagePrimitive>
                                                    {t(activeItem)}
                                                </IGRPBreadcrumbPagePrimitive>
                                            </IGRPBreadcrumbItemPrimitive>
                                        </IGRPBreadcrumbListPrimitive>
                                    </IGRPBreadcrumbPrimitive>
                                </div>
                            </header>

                            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
                                {data.nav.find(
                                    (item) => item.name === activeItem
                                )?.component ? (
                                    React.createElement(
                                        data.nav.find(
                                            (item) => item.name === activeItem
                                        )!.component!
                                    )
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground">
                                            {t('selectSettingToView')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </IGRPScrollAreaPrimitive>
                    </main>
                </IGRPSidebarProviderPrimitive>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
}
