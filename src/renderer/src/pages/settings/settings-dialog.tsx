'use client';

import { Bell, Globe, Home, Link, Settings, X } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@renderer/components/ui/breadcrumb';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@renderer/components/ui/dialog';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from '@renderer/components/ui/sidebar';
import { AboutSettings } from './about-settings';
import { LanguageSettings } from './language-settings';
import { ConnectedAccountsSettings } from './connected-accounts-settings';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip';

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
    ],
};

export function SettingsDialog() {
    const [activeItem, setActiveItem] = React.useState('about');
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <Settings className="w-5 h-5" />
                            <span className="sr-only">{t('settings')}</span>
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>{t('settings')}</TooltipContent>
            </Tooltip>

            <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[800px] max-w-[900px]">
                <DialogTitle className="sr-only">{t('settings')}</DialogTitle>
                <DialogDescription className="sr-only">
                    Customize your settings here.
                </DialogDescription>

                <SidebarProvider className="items-start">
                    <Sidebar collapsible="none" className="hidden md:flex">
                        <SidebarContent>
                            <SidebarGroup>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {data.nav.map((item) => (
                                            <SidebarMenuItem key={item.name}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={item.name === activeItem}
                                                    onClick={() => setActiveItem(item.name)}
                                                >
                                                    <button>
                                                        <item.icon />
                                                        <span>{t(item.name)}</span>
                                                    </button>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </SidebarContent>
                    </Sidebar>
                    <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink href="#/">
                                                Settings
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>
                                                {activeItem}
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                        </header>
                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
                            {data.nav.find((item) => item.name === activeItem)?.component ? (
                                React.createElement(
                                    data.nav.find((item) => item.name === activeItem)!.component!
                                )
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground">
                                        Select a setting to view
                                    </p>
                                </div>
                            )}
                        </div>
                    </main>
                </SidebarProvider>
            </DialogContent>
        </Dialog>
    );
}