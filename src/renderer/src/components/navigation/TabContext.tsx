import { OptionType } from '@renderer/constants/appConstants';
import { getId } from '@renderer/utils/helpers';
import React, { createContext, useContext, useState } from 'react';

export interface TabItem {
    id: string;
    title: string;
    open: OptionType;
    item?: any;
}

export const TAB_DEFAULT = 'tab-0';

interface TabContextType {
    tabs: TabItem[];
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    handleNewTab: (tab: TabItem) => void;
    handleCloseTab: (tabId: string) => void;
    handleUpdateTab: (oldId: string, newId: string) => void;
    handleRenameTab: (tabId: string, newTitle: string) => void;
    handleMoveTab: (fromIndex: number, toIndex: number) => void;
    tabExists: (tabId: string) => void;
    newTab: ({ title, type }: { title?: string; type?: OptionType }) => void; // Add newTab function
    initializeTabFromCurrentItem: (currentItem: any) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [tabs, setTabs] = useState<Array<TabItem>>([
        { id: 'tab-0', title: 'Overview', open: 'none' },
    ]);
    const [activeTab, setActiveTab] = useState('tab-0');

    const handleNewTab = (tab: TabItem) => {
        setTabs(
            (prevTabs) =>
                prevTabs.some((t) => t.id === tab.id)
                    ? prevTabs.map((t) =>
                          t.id === tab.id ? { ...t, ...tab } : t
                      ) // Update existing tab
                    : [...prevTabs, tab] // Add new tab
        );
        setActiveTab(tab.id);
    };

    const handleCloseTab = (tabId: string) => {
        setTabs((prevTabs) => {
            const updatedTabs = prevTabs.filter((t) => t.id !== tabId);
            if (activeTab === tabId) {
                const newActiveTab =
                    updatedTabs.length > 0
                        ? updatedTabs[updatedTabs.length - 1].id
                        : 'tab-0';
                setActiveTab(newActiveTab);
            }
            return updatedTabs;
        });
    };

    const handleUpdateTab = (_oldId: string, _newId: string) => {
        // Implement update logic if needed
    };

    const handleRenameTab = (tabId: string, newTitle: string) => {
        setTabs((prevTabs) =>
            prevTabs.map((tab) =>
                tab.id === tabId ? { ...tab, title: newTitle } : tab
            )
        );
    };

    const handleMoveTab = (fromIndex: number, toIndex: number) => {
        setTabs((prevTabs) => {
            const updatedTabs = [...prevTabs];
            const [movedTab] = updatedTabs.splice(fromIndex, 1);
            updatedTabs.splice(toIndex, 0, movedTab);
            return updatedTabs;
        });
    };

    const tabExists = (tabId: string) => {
        return tabs.some((tab) => tab.id === tabId);
    };

    const newTab = ({ title, type }: { title?: string; type?: OptionType }) => {
        const newTabId = getId();
        handleNewTab({
            id: newTabId,
            title: title || `New...`,
            open: type || 'none',
            item: { id: newTabId },
        });
    };

    const initializeTabFromCurrentItem = (currentItem: any) => {
        if (currentItem) {
            const newTabId = currentItem.id || getId();
            const actionType = currentItem.actionType || currentItem.type;
            handleNewTab({
                id: newTabId,
                title:
                    currentItem.isNew && actionType
                        ? `new${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`
                        : currentItem.label,
                open: actionType,
                item: { ...currentItem, id: newTabId },
            });
        }
    };

    return (
        <TabContext.Provider
            value={{
                tabs,
                activeTab,
                setActiveTab,
                handleNewTab,
                handleCloseTab,
                handleUpdateTab,
                handleRenameTab, // New function
                handleMoveTab, // New function
                tabExists,
                newTab,
                initializeTabFromCurrentItem,
            }}
        >
            {children}
        </TabContext.Provider>
    );
};

export const useTabs = () => {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabProvider');
    }
    return context;
};
