'use client'

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@renderer/components/ui/breadcrumb'
import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@renderer/components/ui/dialog'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider
} from '@renderer/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { ROUTES } from '@renderer/routes/routeConstants'
import { Bell, Globe, Home, Keyboard, Link, Settings, Shirt, Sparkles } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { AboutSettings } from './sections/about'
import { AIProvidersSettings } from './sections/ai-providers'
import { AppearanceSettings } from './sections/appearance'
import { ConnectedAccountsSettings } from './sections/connected-accounts'
import KeyboardShortcuts from './sections/keyboard-shortcuts'
import { LanguageSettings } from './sections/language'

const data = {
    nav: [
        { name: 'about', icon: Home, component: AboutSettings },
        { name: 'ai_providers', icon: Sparkles, component: AIProvidersSettings },
        { name: 'language', icon: Globe, component: LanguageSettings },
        {
            name: 'connected_accounts',
            icon: Link,
            component: ConnectedAccountsSettings
        },
        { name: 'notifications', icon: Bell },
        { name: 'appearance', icon: Shirt, component: AppearanceSettings },
        { name: 'shortcuts', icon: Keyboard, component: KeyboardShortcuts }
    ]
}

export function SettingsDialog({ triggerClassName }: { triggerClassName?: string }) {
    const [activeItem, setActiveItem] = React.useState('about')
    const { t } = useTranslation()
    const [open, setOpen] = React.useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className={triggerClassName}>
                            <Settings className="h-3.5 w-3.5" />
                            <span className="sr-only">{t('settings')}</span>
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>{t('settings')}</TooltipContent>
            </Tooltip>
            <DialogContent className="overflow-hidden p-0 md:max-h-[500px] sm:max-w-[600px] md:max-w-[700px] max-w-4xl">
                <DialogHeader className="pb-3">
                    <DialogTitle className="sr-only">{t('settings')}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {t('customizeSettingsHere')}
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

                    <main className="flex h-[480px] flex-1 flex-col">
                        <ScrollArea className="h-full">
                            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                                <div className="flex items-center gap-2 px-4">
                                    <Breadcrumb>
                                        <BreadcrumbList>
                                            <BreadcrumbItem className="hidden md:block">
                                                <BreadcrumbLink href={ROUTES.HOME}>
                                                    {t('settings')}
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator className="hidden md:block" />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage>{t(activeItem)}</BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </div>
                            </header>

                            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                                {data.nav.find((item) => item.name === activeItem)?.component ? (
                                    React.createElement(
                                        data.nav.find((item) => item.name === activeItem)!
                                            .component!
                                    )
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground">
                                            {t('selectSettingToView')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </main>
                </SidebarProvider>
            </DialogContent>
        </Dialog>
    )
}
