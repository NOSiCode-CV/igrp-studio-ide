import { useEffect, useState } from 'react';
import TabManager, {
    TabItem,
} from '@renderer/generators/api/components/TabManager';
import { PAGE_DEFAULT } from '@renderer/constants/appConstants';
import { useTranslation } from 'react-i18next';

interface PageBuilderProps {
    basePath?: string;
    currentItem?: any;
    folders?: any;
}

const Index = ({ basePath, currentItem }: PageBuilderProps) => {
    const { t } = useTranslation();

    const [tabs, setTabs] = useState<Array<TabItem>>([
        { id: 'tab-0', title: PAGE_DEFAULT, open: 'none' },
    ]);
    const [activeTab, setActiveTab] = useState('tab-0');

    // Add a new tab or activate an existing one
    const handleNewTab = (tab: TabItem) => {
        setTabs(
            (prevTabs) =>
                prevTabs.some((t) => t.id === tab.id)
                    ? prevTabs.map((t) =>
                          t.id === tab.id ? { ...t, ...tab } : t
                      ) // Update the existing tab
                    : [...prevTabs, tab] // Add new tab if it doesn't exist
        );
        setActiveTab(tab.id);
    };

    // Close an existing tab and adjust activeTab
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

    const handleUpdateTab = (oldId: string, newId: string) => {
        /*  setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === oldId
          ? {
              ...t,
              id: newId,
              item
            }
          : t
      )
    );

    setActiveTab(newId);

    console.log(tabs) */
    };

    useEffect(() => {
        if (currentItem) {
            const actionType = currentItem.actionType || currentItem.type;
            handleNewTab({
                id: `tab-${currentItem.module}-${currentItem.isNew ? Date.now() : currentItem.label}`,
                title:
                    currentItem.isNew && actionType
                        ? t(
                              `new${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`
                          )
                        : currentItem.label,
                open: actionType,
                item: currentItem,
            });
        }
    }, [currentItem]);

    return (
        <TabManager
            basePath={basePath}
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setNewTab={handleNewTab}
            onCloseTab={handleCloseTab}
            onUpdateTab={handleUpdateTab}
        />
    );
};

export default Index;
