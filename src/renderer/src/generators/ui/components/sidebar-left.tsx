import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from '@renderer/components/ui/sidebar';
import { cn } from '@renderer/lib/utils';
import {
    Badge,
    ChevronRight,
    Component,
    FileText,
    FolderTree,
    GitBranch,
    GripHorizontal,
    Home,
    ListTodo,
    ListTree,
    Terminal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { filterSubItems } from '@renderer/utils/helpers';
import React, { useEffect, useState } from 'react';
import { MenuItem } from 'src/main/types';
import FileExplorerSidebar from '@renderer/components/fileExplorer';
import { GitCommitsSidebar } from '@renderer/components/git/git-list-commits';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@renderer/components/ui/collapsible';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import SidebarAppComponents from './sidebar-app-components';
import Draggable from '@renderer/lib/dnd/Draggable';
import LogTerminal from './LogTerminal';
import useStudio from '@renderer/hooks/useStudio';
import NavigatorSidebar from './NavigatorSidebar';

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
    data: Array<any>;
    basePath: string;
};

export function AppSidebar({
    data: initialData,
    basePath,
    ...props
}: AppSidebarProps) {
    const { getRegistryComponent } = useStudio();
    const { setOpen } = useSidebar();
    const { t } = useTranslation();
    const [activeMenuGroup, setActiveMenuGroup] =
        useState<string>('widgetPalette');

    const [filteredData, setFilteredData] = useState(initialData);

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        getRegistryComponent();
    }, []);

    useEffect(() => {
        setFilteredData(filterSubItems(initialData, searchQuery));
    }, [searchQuery, initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleNavegationClick = (item: any) => {
        setActiveMenuGroup(item.id);
    };

    const navegations: MenuItem[] = [
        { icon: ListTodo, label: t('widgetPalette'), id: 'widgetPalette' },
        { icon: Component, label: t('components'), id: 'components' },
        { icon: FolderTree, label: t('navigator'), id: 'navigator' },
        { icon: FileText, label: t('explorer'), id: 'explorer' },
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
        {
            icon: Terminal,
            label: t('debug'),
            id: 'debug',
        },
    ];

    return (
        <Sidebar
            collapsible="icon"
            className={cn(
                'overflow-hidden *:data-[sidebar=sidebar]:flex-row top-(--header-height-two)! h-[calc(100svh-var(--header-height-two))]!',
                props.className
            )}
            {...props}
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
                                {navegations.map((item) => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            tooltip={{
                                                children: t(item.label),
                                                hidden: false,
                                            }}
                                            onClick={() => {
                                                setOpen(true);
                                                handleNavegationClick(item);
                                            }}
                                            isActive={
                                                activeMenuGroup === item.id
                                            }
                                            size="lg"
                                            className="px-2.5 md:px-2 flex flex-col h-auto rounded-lg"
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center">
                                                <item.icon size={20} />
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
                <SidebarHeader className="gap-3.5 border-b p-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-base font-medium text-foreground">
                            {t(activeMenuGroup)}
                        </div>
                    </div>
                    {activeMenuGroup !== 'terminal' && (
                        <SidebarInput
                            placeholder="Type to search..."
                            value={searchQuery}
                            onChange={handleInputChange}
                        />
                    )}
                </SidebarHeader>
                <SidebarContent>
                    <ScrollArea>
                        {activeMenuGroup === 'explorer' ? (
                            <FileExplorerSidebar
                                basePath={basePath}
                                searchTerm={searchQuery}
                            />
                        ) : activeMenuGroup === 'navigator' ? (
                            <NavigatorSidebar
                                basePath={basePath}
                                searchTerm={searchQuery}
                            />
                        ) : activeMenuGroup === 'git' ? (
                            <GitCommitsSidebar
                                basePath={basePath}
                                onSelectCommit={(commit) => {
                                    console.log('Selected Commit:', commit);
                                    // Optional: Handle commit selection
                                }}
                            />
                        ) : activeMenuGroup === 'components' ? (
                            <SidebarAppComponents searchTerm={searchQuery} />
                        ) : activeMenuGroup === 'debug' ? (
                            <LogTerminal basePath={basePath} />
                        ) : (
                            filteredData.map((item, index) => (
                                <Collapsible
                                    key={index}
                                    title={item.label}
                                    defaultOpen
                                    className="group/collapsible"
                                >
                                    <SidebarGroup>
                                        <SidebarGroupLabel
                                            asChild
                                            className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                        >
                                            <CollapsibleTrigger>
                                                {item.label}
                                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                            </CollapsibleTrigger>
                                        </SidebarGroupLabel>
                                        <CollapsibleContent>
                                            <SidebarGroupContent>
                                                <SidebarMenu className="grid grid-cols-2 gap-3 p-3 rounded-lg">
                                                    {item.subItems.map(
                                                        (
                                                            subItem: MenuItem,
                                                            key: number
                                                        ) => (
                                                            <SidebarMenuItem
                                                                key={key}
                                                                className="flex flex-col items-center justify-center bg-muted rounded-md shadow-xs"
                                                            >
                                                                <Draggable
                                                                    item={
                                                                        subItem
                                                                    }
                                                                    className="w-full h-full"
                                                                    dropZone={
                                                                        false
                                                                    }
                                                                    type={
                                                                        item.type
                                                                    }
                                                                >
                                                                    <div
                                                                        className="p-2 rounded-lg cursor-move flex flex-col items-center gap-2
                                                                     shadow-sm border text-xs border-gray-200 hover:shadow-md transition-shadow duration-200 bg-card h-full"
                                                                    >
                                                                        <GripHorizontal className="w-4 h-4 text-gray-400" />

                                                                        <div className="flex flex-col items-center gap-2">
                                                                            {subItem.icon && (
                                                                                <subItem.icon className="w-6 h-6" />
                                                                            )}
                                                                            <span className="text-center">
                                                                                {
                                                                                    subItem.label
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </Draggable>
                                                            </SidebarMenuItem>
                                                        )
                                                    )}
                                                </SidebarMenu>
                                            </SidebarGroupContent>
                                        </CollapsibleContent>
                                    </SidebarGroup>
                                </Collapsible>
                            ))
                        )}
                    </ScrollArea>
                </SidebarContent>
            </Sidebar>
        </Sidebar>
    );
}
