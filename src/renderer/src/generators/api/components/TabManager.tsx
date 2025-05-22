import { useEffect } from 'react';
import { Separator } from '@renderer/components/ui/separator';
import { ContainerScrollArea } from './ContainerScrollArea';
import PageController from '../pages/PageWrapper';
import Overview from '../pages/overview';
import { TabItem, useTabs } from '@renderer/components/navigation/TabContext';
import TabsNavigation from '@renderer/components/navigation/tabs-navigation';
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
        initializeTabFromCurrentItem,
    } = useTabs();

    const handleOpenNew = (tab: TabItem) => {
        handleNewTab(tab);
    };

    useEffect(() => {
        initializeTabFromCurrentItem(currentItem);
    }, [currentItem]);

    return (
        <>
            <TabsNavigation
                tabs={tabs}
                activeTab={activeTab}
                newTab={newTab}
                setActiveTab={setActiveTab}
            />

            <Separator />

            <ContainerScrollArea>
                {/* Tab Content */}
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={activeTab === tab.id ? t('block') : t('hidden')}
                    >
                        {tab.id === TAB_DEFAULT ? (
                            <Overview />
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
