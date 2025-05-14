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
    SquareFunction,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { filterSubItems } from '@renderer/utils/helpers';
import React, { useEffect, useRef, useState } from 'react';
import { MenuItem } from 'src/main/types';
import FileExplorerSidebar from '@renderer/components/fileExplorer';
import { GitCommitsSidebar } from '@renderer/components/git/git-list-commits';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@renderer/components/ui/collapsible';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import Draggable from '@renderer/lib/dnd/Draggable';
import useStudio from '@renderer/hooks/use-studio';
import NavigatorSidebar from './sidebar-navigator';
import { SHORTCUTS } from '@renderer/constants/shortcutConstants';
import SidebarAppComponents from './sidebar-app-components';
import { useKeyPress } from '@renderer/hooks/useKeyDown';
import { KeyboardKey } from '@renderer/constants/KeyboardKey';
import {
    CustomCodeMenu,
    SidebarAppCustomCode,
} from './custom-code/sidebar-app-custom-code';

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
    const [activeMenuGroup, setActiveMenuGroup] = useState({
        icon: ListTodo,
        label: t('widgetPalette'),
        id: 'widgetPalette',
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [filteredData, setFilteredData] = useState(initialData);

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        getRegistryComponent();
    }, []);

    useEffect(() => {
        setFilteredData(filterSubItems(initialData, searchQuery));
    }, [searchQuery, initialData]);

    useKeyPress(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
    }, [KeyboardKey.find]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleNavegationClick = (item: any) => {
        setActiveMenuGroup(item);
    };

    const navegations: MenuItem[] = [
        { icon: ListTodo, label: t('widgetPalette'), id: 'widgetPalette' },
        { icon: Component, label: t('components'), id: 'components' },
        { icon: SquareFunction, label: t('Custom Code'), id: 'customCode' },
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
    ];

    return (
        <Sidebar
            collapsible="icon"
            className={cn(
                'overflow-hidden *:data-[sidebar=sidebar]:flex-row top-(--header-height-two)! h-[calc(100svh-var(--header-height-three))]!',
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
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <Home className="size-4" />
                                    </div>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent className="overflow-hidden ">
                    <SidebarGroup>
                        <SidebarGroupContent className="md:px-0">
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
                                                activeMenuGroup.id === item.id
                                            }
                                            size="lg"
                                            className={cn(
                                                'px-2.5 md:px-2 flex flex-col h-auto rounded-lg truncate',
                                                item.id ===
                                                    activeMenuGroup.id &&
                                                    '!text-primary'
                                            )}
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
                <SidebarHeader className="gap-3.5 border-b">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex flex-1 space-x-2  items-center">
                            <activeMenuGroup.icon size={20} />
                            <div className="text-base font-medium text-foreground">
                                {t(activeMenuGroup.label)}
                            </div>
                        </div>
                        {activeMenuGroup.id === 'customCode' && (
                            <CustomCodeMenu />
                        )}
                    </div>
                    <SidebarInput
                        placeholder={`Search (${SHORTCUTS.FIND})`}
                        value={searchQuery}
                        onChange={handleInputChange}
                        ref={searchInputRef}
                    />
                </SidebarHeader>
                <SidebarContent className="overflow-hidden">
                    <ScrollArea className="h-[calc(100vh-230px)]">
                        {activeMenuGroup.id === 'explorer' ? (
                            <FileExplorerSidebar
                                basePath={basePath}
                                searchTerm={searchQuery}
                            />
                        ) : activeMenuGroup.id === 'navigator' ? (
                            <NavigatorSidebar
                                basePath={basePath}
                                searchTerm={searchQuery}
                            />
                        ) : activeMenuGroup.id === 'git' ? (
                            <GitCommitsSidebar
                                basePath={basePath}
                                onSelectCommit={(commit) => {
                                    console.log('Selected Commit:', commit);
                                    // Optional: Handle commit selection
                                }}
                            />
                        ) : activeMenuGroup.id === 'components' ? (
                            <SidebarAppComponents searchTerm={searchQuery} />
                        ) : activeMenuGroup.id === 'customCode' ? (
                            <SidebarAppCustomCode searchTerm={searchQuery} />
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
                                                                    className="w-full h-full p-2 rounded-lg cursor-move flex flex-col items-center gap-2
                                                                     shadow-sm border text-xs border-gray-200 hover:shadow-md transition-shadow duration-200 bg-card "
                                                                    dropZone={
                                                                        false
                                                                    }
                                                                    type={
                                                                        item.type
                                                                    }
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
