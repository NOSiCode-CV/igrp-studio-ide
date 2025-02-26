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
    GitBranch,
    Home,
    ListTodo
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { filterSubItems } from '@renderer/utils/helpers';
import React, { useEffect, useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import DraggableElement from '@renderer/generators/ui/dnd/DraggableElement';
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

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
    data: Array<any>;
    basePath: string;
};

export function AppSidebar({
    data: initialData,
    basePath,
    ...props
}: AppSidebarProps) {
    const { setOpen } = useSidebar();
    const { t } = useTranslation();
    const [activeMenuGroup, setActiveMenuGroup] =
        useState<string>('widgetPalette');

    const [originalData, _setOriginalData] = useState(initialData);
    const [filteredData, setFilteredData] = useState(initialData);

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredData(originalData);
        } else {
            setFilteredData(filterSubItems(originalData, searchQuery));
        }
    }, [searchQuery, originalData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleNavegationClick = (item: any) => {
        setActiveMenuGroup(item.id);
    };

    const navegations: MenuItem[] = [
        { icon: ListTodo, label: t('widgetPalette'), id: 'widgetPalette' },
        { icon: Component, label: t('components'), id: 'components' },
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
                                            <span className="text-xs text-center sr-only">
                                                {t(item.label)}
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
                    <SidebarInput
                        placeholder="Type to search..."
                        value={searchQuery}
                        onChange={handleInputChange}
                    />
                </SidebarHeader>
                <SidebarContent>
                    <ScrollArea>
                        {activeMenuGroup === 'explorer' ? (
                            <FileExplorerSidebar
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
                        ) : (
                            filteredData.map((item, index) => (
                                <Collapsible
                                    key={index}
                                    title={item.title}
                                    defaultOpen
                                    className="group/collapsible"
                                >
                                    <Droppable
                                        droppableId={item.id}
                                        key={item.id}
                                        isDropDisabled={true}
                                        type={item.type}
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
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
                                                                        item: MenuItem,
                                                                        key: number
                                                                    ) => (
                                                                        <SidebarMenuItem
                                                                            key={
                                                                                key
                                                                            }
                                                                            className="flex flex-col items-center justify-center bg-muted rounded-md shadow-xs"
                                                                        >
                                                                            <DraggableElement
                                                                                item={
                                                                                    item
                                                                                }
                                                                                index={
                                                                                    key
                                                                                }
                                                                            />
                                                                        </SidebarMenuItem>
                                                                    )
                                                                )}
                                                            </SidebarMenu>
                                                        </SidebarGroupContent>
                                                    </CollapsibleContent>
                                                </SidebarGroup>
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </Collapsible>
                            ))
                        )}
                    </ScrollArea>
                </SidebarContent>
            </Sidebar>
        </Sidebar>
    );
}
