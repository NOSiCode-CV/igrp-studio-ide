import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarTrigger,
    useSidebar,
} from '@renderer/components/ui/sidebar';
import { Badge, ChevronRight, FileText, Home, Server } from 'lucide-react';

import { cn } from '@renderer/lib/utils';
import { filterSubItems } from '@renderer/utils/helpers';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@renderer/components/ui/collapsible';
import { ConfigOptions, MenuItem } from 'src/main/types';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { AppSidebarHeader } from './app-sidebar-header';
import { DropdownSidebarMenuButton } from './dropdown-sidebar-menu-button';
import { useNavigate } from 'react-router-dom';

interface AppSidebarProps {
    className?: string;
    menuItems: MenuItem[];
    config?: ConfigOptions;
    basePath?: string;
    header?: boolean;
}

export function AppSidebar({
    className,
    menuItems,
    config,
    basePath,
    header,
}: AppSidebarProps) {
    const { t } = useTranslation();
    const { setOpen } = useSidebar();
    const { state: sidebarState } = useSidebar();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeItem, setActiveItem] = useState('');
    const filteredNavData = filterSubItems(menuItems, searchQuery);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
    };

    const handleSubItemClick = (e: React.MouseEvent, subItem: MenuItem) => {
        e.preventDefault();
        if (subItem.click) {
            subItem.click(subItem);
        }
        setActiveItem(subItem.label);
    };

    const menuIcons: MenuItem[] = [
        { icon: Server, link: '/app', label: 'APIs', id: 'app' },
        { icon: FileText, link: '/documents', label: 'Documents' },
        { icon: Badge, link: '/settings', label: 'Settings' },
    ];
    return (
        <>
            <Sidebar
                collapsible="icon"
                className={cn(
                    'overflow-hidden [&>[data-sidebar=sidebar]]:flex-row mt-10',
                    className
                )}
            >
                {/* First Sidebar */}
                <Sidebar
                    collapsible="none"
                    className={cn(
                        '!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r',
                        '!w-20'
                    )}
                >
                    <SidebarHeader className="pr-0">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    size="lg"
                                    asChild
                                    className="md:h-8 md:p-0 items-center justify-center"
                                >
                                    <a href="/">
                                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-igrp text-sidebar-primary-foreground">
                                            <Home className="size-4" />
                                        </div>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent className="px-1.5 md:px-0">
                                <SidebarMenu>
                                    {menuIcons.map((item, index) => (
                                        <SidebarMenuItem key={index}>
                                            <SidebarMenuButton
                                                tooltip={{
                                                    children: t(item.label),
                                                    hidden: false,
                                                }}
                                                onClick={() => {
                                                    setOpen(true);
                                                }}
                                                className="px-2.5 md:px-2 flex flex-col h-auto rounded-lg"
                                                isActive={item.id === 'app'}
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center">
                                                    {item.icon && (
                                                        <item.icon size={20} />
                                                    )}
                                                </div>
                                                <span className="text-xs text-center">
                                                    {item.label}
                                                </span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter className="items-center justify-center">
                        <SidebarTrigger className="mb-14 items-center justify-center" />
                    </SidebarFooter>
                </Sidebar>

                {/* Second Sidebar */}
                <Sidebar collapsible="none" className="hidden flex-1 md:flex">
                    {header && (
                        <AppSidebarHeader
                            config={config}
                            basePath={basePath}
                            sidebarState={sidebarState}
                            handleSearch={handleSearch}
                        />
                    )}
                    <SidebarContent className="mb-10">
                        <ScrollArea>
                            <SidebarGroup>
                                <SidebarGroupContent>
                                    {filteredNavData.map(
                                        (item: MenuItem, index: number) => (
                                            <SidebarMenu key={index}>
                                                <Three
                                                    key={index}
                                                    item={item}
                                                    handleSubItemClick={
                                                        handleSubItemClick
                                                    }
                                                    activeItem={activeItem}
                                                />
                                            </SidebarMenu>
                                        )
                                    )}
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </ScrollArea>
                    </SidebarContent>
                </Sidebar>
            </Sidebar>
        </>
    );
}

function Three({
    item,
    handleSubItemClick,
    activeItem,
}: {
    item: MenuItem;
    handleSubItemClick: (e: React.MouseEvent, subItem: MenuItem) => void;
    activeItem: string;
}) {
    const [open, setOpen] = React.useState(true);

    const handleOpenChange = (newState) => {
        setOpen(newState);
    };

    const { t } = useTranslation();
    const navigate = useNavigate();
    const handleNavigation = (link) => {
        if (link) navigate(link);
    };

    const TreeItem = () => {
        return (
            <SidebarMenuButton
                onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation(item.link);
                    handleSubItemClick(e, item);
                    handleOpenChange(!open);
                }}
                className="data-[active=true]:bg-transparent group/icon flex justify-between"
                isActive={activeItem === item.label}
            >
                <div className="flex items-center space-x-2">
                    {item.subItems && item.subItems.length > 0 && (
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    )}

                    {item.icon && <item.icon className="h-4 w-4" />}

                    {item.badgeName && (
                        <span
                            className={cn(
                                'text-orange-500',
                                `${item.badgeColor}`
                            )}
                        >
                            {item.badgeName}
                        </span>
                    )}
                    <span>
                        {t(item.label)}
                        {item.subItems &&
                            item.subItems.length > 0 &&
                            `(${item.subItems.length})`}
                    </span>
                </div>

                <div className="flex items-center opacity-0 group-hover/icon:opacity-100">
                    <DropdownSidebarMenuButton menuItem={item} />
                </div>
            </SidebarMenuButton>
        );
    };

    if (!item.subItems?.length) {
        return <TreeItem />;
    }

    return (
        <SidebarMenuItem>
            <Collapsible
                className="group/collapsible"
                open={open}
                onOpenChange={handleOpenChange}
            >
                <CollapsibleTrigger asChild>
                    <TreeItem />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="!pr-0 !mr-0">
                        {item.subItems?.map((subItem, subIndex) => (
                            <Three
                                key={subIndex}
                                item={subItem}
                                handleSubItemClick={handleSubItemClick}
                                activeItem={activeItem}
                            />
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem>
    );
}
