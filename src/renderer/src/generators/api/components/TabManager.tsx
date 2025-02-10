import React, { useEffect, useRef } from 'react';
import { Book, Plus, X } from 'lucide-react';
import { Separator } from '@renderer/components/ui/separator';
import { Button } from '../../../components/ui/button';
import { cn } from '@renderer/lib/utils';
import { ScrollArea, ScrollBar } from '../../../components/ui/scroll-area';
import { getIcon } from '@renderer/utils/helpers';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from '@renderer/components/ui/context-menu';
import { ContainerScrollArea } from './ContainerScrollArea';
import { TabItem, useTabs } from '@renderer/components/TabContext';
import PageController from '../pages/PageController';
import Overview from '../pages/overview';
import { useTranslation } from 'react-i18next';

const TAB_DEFAULT = 'tab-0';

interface ContentProps {
    basePath?: string;
    currentItem?: any;
}

const TabManager = ({ currentItem }: ContentProps) => {
    const { t } = useTranslation();
    const {
        tabs,
        activeTab,
        newTab,
        setActiveTab,
        handleNewTab,
        handleCloseTab,
        initializeTabFromCurrentItem,
    } = useTabs();

    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleOpenNew = (tab: TabItem) => {
        handleNewTab(tab);
    };

    const handleCloseRight = (tabId: string) => {
        const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
        const tabsToClose = tabs.slice(tabIndex + 1);
        tabsToClose.forEach((tab) => handleCloseTab(tab.id));
    };

    const handleCloseOthers = (tabId: string) => {
        tabs.forEach((tab) => {
            if (tab.id !== tabId && tab.id !== TAB_DEFAULT) {
                handleCloseTab(tab.id);
            }
        });
    };

    const handleCloseAll = () => {
        tabs.forEach((tab) => {
            if (tab.id !== TAB_DEFAULT) {
                handleCloseTab(tab.id);
            }
        });
    };

    useEffect(() => {
        initializeTabFromCurrentItem(currentItem);
    }, [currentItem]);

    const onClickNewTab = () => {
        newTab();
        setTimeout(() => {
            scrollAreaRef.current?.scrollTo({
                left: scrollAreaRef.current.scrollWidth,
                behavior: 'smooth',
            });
        }, 0);
    };

    return (
        <>
            {/* Tabs Navigation */}
            <nav className="flex justify-between">
                <div className="flex flex-1 w-[100px]">
                    <ScrollArea ref={scrollAreaRef}>
                        <div className="flex items-center whitespace-nowrap">
                            {tabs.map((tab) => {
                                const Icon = getIcon(tab.open);
                                return (
                                    <React.Fragment key={tab.id}>
                                        <ContextMenu>
                                            <ContextMenuTrigger>
                                                <div
                                                    className={cn(
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
                                                        {tab.item &&
                                                        tab.item.badgeName ? (
                                                            <span
                                                                className={cn(
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
                                                        ) : tab.id ===
                                                          TAB_DEFAULT ? (
                                                            <Book className="h-3" />
                                                        ) : (
                                                            <Icon className="h-3" />
                                                        )}
                                                        <span>{tab.title}</span>
                                                        {tab.id !==
                                                            TAB_DEFAULT && (
                                                            <Button
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleCloseTab(
                                                                        tab.id
                                                                    );
                                                                }}
                                                                variant="ghost"
                                                                size="sm"
                                                                className={cn(
                                                                    'opacity-0 group-hover/tab:opacity-100 size-5'
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
                                                            handleCloseTab(
                                                                tab.id
                                                            )
                                                        }
                                                    >
                                                        {t('closeSelectedTab')}
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
                                                        {t('closeRight')}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        onClick={() =>
                                                            handleCloseOthers(
                                                                tab.id
                                                            )
                                                        }
                                                    >
                                                        {t('closeOthers')}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        onClick={handleCloseAll}
                                                    >
                                                        {t('closeAll')}
                                                    </ContextMenuItem>
                                                </ContextMenuContent>
                                            )}
                                        </ContextMenu>
                                        <Separator
                                            orientation="vertical"
                                            className="h-4"
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
                            onClick={onClickNewTab}
                        >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">{t('newEndpoint')}</span>
                        </Button>
                    </div>
                </div>
            </nav>

            <Separator />

            <ContainerScrollArea>
                {/* Tab Content */}
                {tabs.map((tab) => (
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
                            />
                        )}
                    </div>
                ))}
            </ContainerScrollArea>
        </>
    );
};

export default TabManager;