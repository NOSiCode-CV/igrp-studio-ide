import React, { useRef } from 'react';
import classnames from 'classnames';
import { Book, Plus, X } from 'lucide-react';
import { Separator } from '@renderer/components/ui/separator';
import { Button } from '../../../components/ui/button';
import PageController from '@renderer/generators/api/pages/PageController';
import { OptionType } from '@renderer/constants/appConstants';
import { cn } from '@renderer/lib/utils';
import Overview from '@renderer/generators/api/pages/overview';
import { ScrollArea, ScrollBar } from '../../../components/ui/scroll-area';
import { getIcon } from '@renderer/utils/helpers';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from '@renderer/components/ui/context-menu';

const TAB_DEFAULT = 'tab-0';

export interface TabItem {
    id: string;
    title: string;
    open: OptionType;
    item?: any;
}

interface ContentProps {
    basePath?: string;
    tabs: TabItem[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    setNewTab: (tab: TabItem) => void;
    onCloseTab: (tab: string) => void;
    onUpdateTab: (oldId: string, newId: string) => void;
}

const TabManager = ({
    tabs,
    activeTab,
    setActiveTab,
    setNewTab,
    onCloseTab,
    onUpdateTab,
}: ContentProps) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Handle opening a new tab
    const handleNewTab = () => {
        const newTabId = `tab-${tabs.length + 1}`;
        setNewTab({ id: newTabId, title: `New...`, open: 'none' });
        setTimeout(() => {
            scrollAreaRef.current?.scrollTo({
                left: scrollAreaRef.current.scrollWidth,
                behavior: 'smooth',
            });
        }, 0);
    };

    const handleOpenNew = (tab: TabItem) => {
        setNewTab({
            ...tab,
        });
    };

    const handleCloseRight = (tabId: string) => {
        const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
        const tabsToClose = tabs.slice(tabIndex + 1);
        tabsToClose.forEach((tab) => onCloseTab(tab.id));
    };

    const handleCloseOthers = (tabId: string) => {
        tabs.forEach((tab) => {
            if (tab.id !== tabId && tab.id !== TAB_DEFAULT) {
                onCloseTab(tab.id);
            }
        });
    };

    const handleCloseAll = () => {
        tabs.forEach((tab) => {
            if (tab.id !== TAB_DEFAULT) {
                onCloseTab(tab.id);
            }
        });
    };

    return (
        <>
            {/* Tabs Navigation */}
            <nav className="flex justify-between">
                <div className="flex flex-1 w-[100px]">
                    <ScrollArea ref={scrollAreaRef}>
                        <div className="flex items-center  whitespace-nowrap">
                            {tabs.map((tab) => {
                                const Icon = getIcon(tab.open);
                                return (
                                    <React.Fragment key={tab.id}>
                                        <ContextMenu>
                                            <ContextMenuTrigger>
                                                <div
                                                    className={classnames(
                                                        'px-4 h-10 text-sm font-medium focus:outline-none cursor-pointer align-middle flex',
                                                        {
                                                            'text-igrp border-t-2 border-igrp':
                                                                activeTab ===
                                                                tab.id,
                                                        }
                                                    )}
                                                    onClick={() =>
                                                        setActiveTab(tab.id)
                                                    }
                                                >
                                                    <div className="flex items-center space-x-1 group/tab">
                                                        <Button
                                                            size={'sm'}
                                                            variant="ghost"
                                                            className="size-4"
                                                        >
                                                            {/* Badge Rendering (Condition First) */}
                                                            {tab.item &&
                                                            tab.item
                                                                .badgeName ? (
                                                                <span
                                                                    className={classnames(
                                                                        'text-orange-500',
                                                                        tab.item
                                                                            .badgeColor
                                                                    )}
                                                                >
                                                                    {
                                                                        tab.item
                                                                            .badgeName
                                                                    }
                                                                </span>
                                                            ) : // Icon Rendering Based on Tab ID (Condition Second)
                                                            tab.id ===
                                                              TAB_DEFAULT ? (
                                                                <Book className="h-3" />
                                                            ) : (
                                                                <Icon className="h-3" />
                                                            )}
                                                        </Button>
                                                        <span>{tab.title}</span>
                                                        {tab.id !==
                                                            TAB_DEFAULT && (
                                                            <Button
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    onCloseTab(
                                                                        tab.id
                                                                    );
                                                                }}
                                                                variant="ghost"
                                                                size="sm"
                                                                className={cn(
                                                                    'opacity-0 group-hover/tab:opacity-100 size-4',
                                                                    tab.id ===
                                                                        'tab-0'
                                                                        ? 'invisible'
                                                                        : ''
                                                                )}
                                                            >
                                                                <X className="h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </ContextMenuTrigger>
                                            {tab.id !== TAB_DEFAULT && (
                                                <ContextMenuContent className="w-64">
                                                    <ContextMenuItem
                                                        onClick={() =>
                                                            onCloseTab(tab.id)
                                                        }
                                                    >
                                                        Close Selected Tab
                                                        <ContextMenuShortcut>
                                                            ⌘W
                                                        </ContextMenuShortcut>
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        onClick={() =>
                                                            handleCloseRight(
                                                                tab.id
                                                            )
                                                        }
                                                    >
                                                        Close Right
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        onClick={() =>
                                                            handleCloseOthers(
                                                                tab.id
                                                            )
                                                        }
                                                    >
                                                        Close Others
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        onClick={handleCloseAll}
                                                    >
                                                        Close All
                                                    </ContextMenuItem>
                                                </ContextMenuContent>
                                            )}
                                        </ContextMenu>
                                        <Separator
                                            orientation="vertical"
                                            className="mr-2 h-4"
                                        />
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    <div className="flex items-center px-2 gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleNewTab}
                        >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">New Endpoint</span>
                        </Button>
                    </div>
                </div>
            </nav>

            <Separator />

            {/* Tab Content */}
            {tabs.map((tab) => {
                return (
                    <div
                        key={tab.id}
                        className={activeTab === tab.id ? 'block' : 'hidden'}
                    >
                        {tab.id === TAB_DEFAULT ? (
                            <Overview
                                onOpenNew={handleOpenNew}
                                open={tab.open}
                            />
                        ) : (
                            <PageController
                                onOpenNew={handleOpenNew}
                                open={tab.open}
                                tab={tab}
                                onCloseTab={onCloseTab}
                                onUpdateTab={onUpdateTab}
                            />
                        )}
                    </div>
                );
            })}
        </>
    );
};

export default TabManager;
