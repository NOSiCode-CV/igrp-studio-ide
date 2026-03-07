import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system'
import { type TabItem, useTabs } from '@renderer/components/navigation/TabContext'
import TabsNavigation from '@renderer/components/navigation/tabs-navigation'
import { useEffect } from 'react'
import Overview from '../pages/overview'
import PageController from '../pages/PageWrapper'
import { ContainerScrollArea } from './ContainerScrollArea'

const TAB_DEFAULT = 'tab-0'

interface ContentProps {
    basePath?: string
    currentItem?: any
}

const TabManager = ({ currentItem }: ContentProps) => {
    const { tabs, activeTab, newTab, setActiveTab, handleNewTab, initializeTabFromCurrentItem } =
        useTabs()

    const handleOpenNew = (tab: TabItem) => {
        handleNewTab(tab)
    }

    useEffect(() => {
        initializeTabFromCurrentItem(currentItem)
    }, [currentItem])

    return (
        <>
            <TabsNavigation
                tabs={tabs}
                activeTab={activeTab}
                newTab={newTab}
                setActiveTab={setActiveTab}
            />

            <IGRPSeparator />

            <ContainerScrollArea>
                {/* Tab Content */}
                {tabs.map((tab) => (
                    <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
                        {tab.id === TAB_DEFAULT ? (
                            <Overview />
                        ) : (
                            <PageController onOpenNew={handleOpenNew} open={tab.open} tab={tab} />
                        )}
                    </div>
                ))}
            </ContainerScrollArea>
        </>
    )
}

export default TabManager
