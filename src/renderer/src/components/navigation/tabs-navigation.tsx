import React, { ReactNode, useRef } from 'react';
import { Book, Plus, X } from 'lucide-react';
import {
    IGRPContextMenuContentPrimitive,
    IGRPContextMenuItemPrimitive,
    IGRPContextMenuPrimitive,
    IGRPContextMenuShortcutPrimitive,
    IGRPContextMenuTriggerPrimitive,
    IGRPScrollAreaPrimitive,
    IGRPScrollBarPrimitive,
    IGRPSeparatorPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { cn } from '@renderer/lib/utils';
import { getIcon } from '@renderer/utils';
import { useTranslation } from 'react-i18next';
import { TAB_DEFAULT, TabItem, useTabs } from './TabContext';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
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
        <nav className="flex justify-between pr-5 bg-sidebar">
            <div className="flex flex-1 w-[100px]">
                <IGRPScrollAreaPrimitive ref={scrollAreaRef}>
                    <div className="flex items-center whitespace-nowrap">
                        {tabs.map((tab) => {
                            const Icon = getIcon(tab.open);
                            return (
                                <React.Fragment key={tab.id}>
                                    <IGRPContextMenuPrimitive>
                                        <IGRPContextMenuTriggerPrimitive>
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
                                                        <IGRPButtonPrimitive
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
                                                        </IGRPButtonPrimitive>
                                                    )}
                                                </div>
                                            </div>
                                        </IGRPContextMenuTriggerPrimitive>
                                        {tab.id !== TAB_DEFAULT && (
                                            <IGRPContextMenuContentPrimitive className="w-64">
                                                <IGRPContextMenuItemPrimitive
                                                    onClick={() =>
                                                        handleCloseTab(tab.id)
                                                    }
                                                >
                                                    {t('closeSelectedTab')}
                                                    <IGRPContextMenuShortcutPrimitive>
                                                        {SHORTCUTS.CLOSE_TAB}
                                                    </IGRPContextMenuShortcutPrimitive>
                                                </IGRPContextMenuItemPrimitive>
                                                <IGRPContextMenuItemPrimitive
                                                    onClick={() =>
                                                        handleCloseRight(tab.id)
                                                    }
                                                >
                                                    {t('closeRight')}
                                                </IGRPContextMenuItemPrimitive>
                                                <IGRPContextMenuItemPrimitive
                                                    onClick={() =>
                                                        handleCloseLeft(tab.id)
                                                    }
                                                >
                                                    {t('closeLeft')}
                                                </IGRPContextMenuItemPrimitive>
                                                <IGRPContextMenuItemPrimitive
                                                    onClick={() =>
                                                        handleCloseOthers(
                                                            tab.id
                                                        )
                                                    }
                                                >
                                                    {t('closeOthers')}
                                                </IGRPContextMenuItemPrimitive>
                                                <IGRPContextMenuItemPrimitive
                                                    onClick={handleCloseAll}
                                                >
                                                    {t('closeAll')}
                                                </IGRPContextMenuItemPrimitive>
                                            </IGRPContextMenuContentPrimitive>
                                        )}
                                    </IGRPContextMenuPrimitive>
                                    <IGRPSeparatorPrimitive
                                        orientation="vertical"
                                        className="h-4"
                                    />
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <IGRPScrollBarPrimitive
                        orientation="horizontal"
                        className="h-2"
                    />
                </IGRPScrollAreaPrimitive>
                {btnNew && (
                    <div className="flex items-center px-2 gap-2">
                        <IGRPButtonPrimitive
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={onClickNewTab}
                        >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">{t('newEndpoint')}</span>
                        </IGRPButtonPrimitive>
                    </div>
                )}
            </div>
            {children}
        </nav>
    );
};

export default TabsNavigation;
