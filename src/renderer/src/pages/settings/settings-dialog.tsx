'use client';

import {
    Bell,
    Globe,
    Home,
    Keyboard,
    Link,
    Lock,
    MessageCircle,
    Paintbrush,
    Settings,
    Video,
} from 'lucide-react';

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
    DialogHeader,
    DialogTitle,
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

const data = {
    nav: [
        { name: 'About', icon: Home, component: AboutSettings },
        { name: 'Language & region', icon: Globe, component: LanguageSettings },
        {
            name: 'Connected accounts',
            icon: Link,
            component: ConnectedAccountsSettings,
        },
        { name: 'Notifications', icon: Bell },
        { name: 'Appearance', icon: Paintbrush },
        { name: 'Messages & media', icon: MessageCircle },
        { name: 'Accessibility', icon: Keyboard },
        { name: 'Audio & video', icon: Video },
        { name: 'Privacy & visibility', icon: Lock },
        { name: 'Advanced', icon: Settings },
    ],
};

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
    const [activeItem, setActiveItem] = React.useState('About');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[800px] max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Customize your settings here.
                    </DialogDescription>
                </DialogHeader>
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
                                                    isActive={
                                                        item.name === activeItem
                                                    }
                                                    onClick={() =>
                                                        setActiveItem(item.name)
                                                    }
                                                >
                                                    <button>
                                                        <item.icon />
                                                        <span>{item.name}</span>
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
                                            <BreadcrumbLink href="#">
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
                            {data.nav.find((item) => item.name === activeItem)
                                ?.component ? (
                                React.createElement(
                                    data.nav.find(
                                        (item) => item.name === activeItem
                                    )!.component!
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
