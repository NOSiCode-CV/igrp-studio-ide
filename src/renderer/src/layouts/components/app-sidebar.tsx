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
import {
    Badge,
    ChevronRight,
    FileText,
    GitBranch,
    Home,
    Server,
} from 'lucide-react';

import { cn } from '@renderer/lib/utils';
import { filterSubItems } from '@renderer/utils/helpers';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@renderer/components/ui/collapsible';
import { ProjectData, MenuItem } from 'src/main/types';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { AppSidebarHeader } from './app-sidebar-header';
import { DropdownSidebarMenuButton } from './dropdown-sidebar';
import { useNavigate } from 'react-router-dom';
import { GitCommitsSidebar } from '@renderer/components/git/git-list-commits';
import FileExplorerSidebar from '@renderer/components/fileExplorer';
import { useNavSettings } from './nav-data';

interface AppSidebarProps {
    className?: string;
    menuItems: MenuItem[];
    config?: ProjectData;
    basePath: string;
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
    const menuApp = filterSubItems(menuItems, searchQuery);

    const { menuItems: othersMenus } = useNavSettings();

    const [activeMenuGroup, setActiveMenuGroup] = useState(t('apis'));
    const [activeMenu, setActiveMenu] = useState(menuApp || []);

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

    useEffect(() => {
        setActiveMenu(menuApp || []);
    }, [menuApp]);

    const handleClickMenu = (item: MenuItem) => {
        setActiveMenuGroup(item.label);
        if (item.id === 'apis') setActiveMenu(menuApp);
        else if (item.id === 'settings') {
            const menuApp = filterSubItems(othersMenus, searchQuery);
            setActiveMenu(menuApp);
        } else setActiveMenu([]);
    };

    const menuIcons: MenuItem[] = [
        { icon: Server, label: t('apis'), id: 'apis' },
        { icon: FileText, label: t('explorer'), id: 'explorer' },
        /*   {
            icon: FileText,
            label: t('documents'),
            id: 'documents',
        }, */
        {
            icon: Badge,
            label: t('settings'),
            id: 'settings',
        },
        {
            icon: GitBranch,
            label: t('git'),
            id: 'git',
        },
    ];

    return (
        <>
            <Sidebar
                collapsible="icon"
                className={cn(
                    'overflow-hidden *:data-[sidebar=sidebar]:flex-row !top-(--header-height) h-[calc(100svh-var(--header-height-two))]',
                    className
                )}
            >
                {/* First Sidebar */}
                <Sidebar
                    collapsible="none"
                    className={cn(
                        'w-[calc(var(--sidebar-width-icon)+1px)]! border-r',
                        'w-20!'
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
                                    <a href="#/">
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
                                                    children: item.label,
                                                    hidden: false,
                                                }}
                                                onClick={() => {
                                                    setOpen(true);
                                                    handleClickMenu(item);
                                                }}
                                                className="px-2.5 md:px-2 flex flex-col h-auto rounded-lg truncate"
                                                isActive={
                                                    item.label ===
                                                    activeMenuGroup
                                                }
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center">
                                                    {item.icon && (
                                                        <item.icon size={20} />
                                                    )}
                                                </div>
                                                <span className="w-16 text-xs text-center block text-ellipsis overflow-hidden whitespace-nowrap truncate">
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
                        <SidebarTrigger className="items-center justify-center" />
                    </SidebarFooter>
                </Sidebar>

                {/* Second Sidebar */}
                <Sidebar collapsible="none" className="hidden flex-1 md:flex">
                    {header && (
                        <AppSidebarHeader
                            name={config?.name}
                            description={activeMenuGroup}
                            basePath={basePath}
                            sidebarState={sidebarState}
                            handleSearch={handleSearch}
                        />
                    )}
                    <SidebarContent>
                        <ScrollArea>
                            {activeMenuGroup === 'Explorer' ? (
                                <FileExplorerSidebar
                                    basePath={basePath}
                                    searchTerm={searchQuery}
                                />
                            ) : activeMenuGroup === 'Git' ? (
                                <GitCommitsSidebar
                                    basePath={basePath}
                                    onSelectCommit={(commit) => {
                                        console.log('Selected Commit:', commit);
                                        // Optional: Handle commit selection
                                    }}
                                />
                            ) : (
                                <SidebarGroup>
                                    <SidebarGroupContent>
                                        {activeMenu.map(
                                            (item: MenuItem, index: number) => (
                                                <SidebarMenu key={index}>
                                                    <Three
                                                        key={index}
                                                        level={index}
                                                        item={item}
                                                        handleSubItemClick={
                                                            handleSubItemClick
                                                        }
                                                        activeItem={activeItem}
                                                        basePath={basePath}
                                                        activeMenuGroup={
                                                            activeMenuGroup
                                                        }
                                                    />
                                                </SidebarMenu>
                                            )
                                        )}
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            )}
                        </ScrollArea>
                    </SidebarContent>
                </Sidebar>
            </Sidebar>
        </>
    );
}

function Three({
    level,
    item,
    handleSubItemClick,
    activeItem,
    basePath,
    activeMenuGroup,
}: {
    level: number;
    item: MenuItem;
    handleSubItemClick: (e: React.MouseEvent, subItem: MenuItem) => void;
    activeItem: string;
    basePath: string;
    activeMenuGroup?: string;
}) {
    const [open, setOpen] = React.useState(level < 1);

    const handleOpenChange = (newState: boolean) => {
        setOpen(newState);
    };

    const navigate = useNavigate();
    const handleNavigation = (link: string | undefined) => {
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
                className="data-[active=true]:bg-transparent group/icon justify-between items-center align-middle"
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
                        {item.label}
                        {item.subItems &&
                            item.subItems.length > 0 &&
                            activeMenuGroup === 'APIs' &&
                            `(${item.subItems.length})`}
                    </span>
                </div>

                <div className="opacity-0 flex items-center group-hover/icon:opacity-100">
                    <DropdownSidebarMenuButton
                        menuItem={item}
                        basePath={basePath}
                    />
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
                    <SidebarMenuSub className="pr-0! mr-0!">
                        {item.subItems?.map((subItem, index) => (
                            <Three
                                key={index}
                                level={index}
                                item={subItem}
                                handleSubItemClick={handleSubItemClick}
                                activeItem={activeItem}
                                basePath={basePath}
                                activeMenuGroup={activeMenuGroup}
                            />
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem>
    );
}
