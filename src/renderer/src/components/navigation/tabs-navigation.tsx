import React, { ReactNode, useRef } from 'react';
import { Book, Plus, X } from 'lucide-react';
import { Separator } from '@renderer/components/ui/separator';
import { cn } from '@renderer/lib/utils';
import { getIcon } from '@renderer/utils';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from '@renderer/components/ui/context-menu';
import { useTranslation } from 'react-i18next';
import { TAB_DEFAULT, TabItem, useTabs } from './TabContext';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { OptionType } from '@renderer/constants/appConstants';
import { SHORTCUTS } from '@renderer/constants/shortcut';

interface TabsNavigationProps {
    tabs: TabItem[];
    activeTab: string;
    newTab: ({ title, type }: { title?: string; type?: OptionType }) => void;
    setActiveTab: (tabId: string) => void;
    children?: ReactNode;
    btnNew?: boolean;
}

const TabsNavigation = ({
    tabs,
    activeTab,
    newTab,
    setActiveTab,
    children,
    btnNew = true,
}: TabsNavigationProps) => {
    const { t } = useTranslation();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const { handleCloseTab } = useTabs();

    const onClickNewTab = () => {
        newTab({});
        setTimeout(() => {
            scrollAreaRef.current?.scrollTo({
                left: scrollAreaRef.current.scrollWidth,
                behavior: 'smooth',
            });
        }, 0);
    };

    const handleCloseRight = (tabId: string) => {
        const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
        const tabsToClose = tabs.slice(tabIndex + 1);
        tabsToClose.forEach((tab) => handleCloseTab(tab.id));
    };

    const handleCloseLeft = (tabId: string) => {
        const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
        const tabsToClose = tabs.slice(0, tabIndex);
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

    return (
        <nav className="flex justify-between pr-5 bg-background">
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
                                                    'px-4 h-10 text-sm font-medium focus:outline-hidden cursor-pointer align-middle flex',
                                                    {
                                                        'text-primary border-t-2 border-primary':
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
                                                            {tab.item.badgeName}
                                                        </span>
                                                    ) : tab.id ===
                                                      TAB_DEFAULT ? (
                                                        <Book className="h-3" />
                                                    ) : (
                                                        <Icon className="h-3" />
                                                    )}
                                                    <span>{tab.title}</span>
                                                    {tab.id !== TAB_DEFAULT && (
                                                        <Button
                                                            onClick={(e) => {
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
                                                        handleCloseTab(tab.id)
                                                    }
                                                >
                                                    {t('closeSelectedTab')}
                                                    <ContextMenuShortcut>
                                                        {SHORTCUTS.CLOSE_TAB}
                                                    </ContextMenuShortcut>
                                                </ContextMenuItem>
                                                <ContextMenuItem
                                                    onClick={() =>
                                                        handleCloseRight(tab.id)
                                                    }
                                                >
                                                    {t('closeRight')}
                                                </ContextMenuItem>
                                                <ContextMenuItem
                                                    onClick={() =>
                                                        handleCloseLeft(tab.id)
                                                    }
                                                >
                                                    {t('closeLeft')}
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
                    <ScrollBar orientation="horizontal" className="h-2" />
                </ScrollArea>
                {btnNew && (
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
                )}
            </div>
            {children}
        </nav>
    );
};

export default TabsNavigation;
