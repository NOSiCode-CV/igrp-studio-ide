import { useRef, useState } from 'react';
import FormEngine from '../FormEngine';
import { File } from 'src/main/types';
import {
    DroppedComponentsProvider,
    useDroppedComponents,
} from '../dnd/DroppedComponentsContext';
import MainPageBuilder from '../page/list-pages';
import { Separator } from '@renderer/components/ui/separator';
import NavigationBar from './NavigationBar';
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar';
import { cn } from '@renderer/lib/utils';
import {
    TAB_DEFAULT,
    useTabs,
} from '@renderer/components/navigation/TabContext';
import TabsNavigation from '@renderer/components/navigation/tabs-navigation';

interface ContentProps {
    basePath: string;
}

export default function TabManager({ basePath }: ContentProps) {
    const { activeTab, tabs, newTab, setActiveTab } = useTabs();

    const [currentPage, setCurrentPage] = useState<File | null>(null);

    // Track the isDesign state for each tab
    const [isDesignStates, setIsDesignStates] = useState<{
        [key: string]: boolean;
    }>({});

    // Ref to hold the handleSave function from FormEngine
    const formEngineRefs = useRef<{
        [key: string]: { handleSave: () => void } | null;
    }>({});

    const handleClickOpenGerador = (page: any) => {
        newTab({ title: page.content.pageName });
        setCurrentPage(page);
    };

    const handleSave = () => {
        // Trigger handleSave in FormEngine for the current tab
        formEngineRefs.current[activeTab]?.handleSave();
    };

    const handleSwitchClick = () => {
        setIsDesignStates((prevState) => ({
            ...prevState,
            [activeTab]: !prevState[activeTab],
        }));
    };

    return (
        <>
            <TabsNavigation
                tabs={tabs}
                activeTab={activeTab}
                newTab={newTab}
                setActiveTab={setActiveTab}
                btnNew={false}
            >
                <NavigationBar
                    isDesign={isDesignStates[activeTab] ?? true}
                    onSave={handleSave}
                    onSwitch={handleSwitchClick}
                    page={activeTab}
                    basePath={basePath}
                />
            </TabsNavigation>

            <Separator />
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={cn(
                        'flex flex-1',
                        activeTab === tab.id ? 'block' : 'hidden'
                    )}
                >
                    {tab.id === TAB_DEFAULT ? (
                        <SidebarInset>
                            <div className="flex flex-1 flex-col gap-4 p-4">
                                <MainPageBuilder
                                    onPageClick={handleClickOpenGerador}
                                />
                            </div>
                        </SidebarInset>
                    ) : (
                        <DroppedComponentsProvider>
                            <SidebarProvider
                                style={
                                    {
                                        '--sidebar-width': '380px',
                                    } as React.CSSProperties
                                }
                            >
                                <FormEngine
                                    ref={(ref) =>
                                        (formEngineRefs.current[tab.id] = ref)
                                    }
                                    basePath={basePath}
                                    page={tab.title}
                                    pagePath={currentPage?.path}
                                    isDesign={isDesignStates[tab.id] ?? true}
                                    onSave={handleSave}
                                />
                            </SidebarProvider>
                        </DroppedComponentsProvider>
                    )}
                </div>
            ))}
        </>
    );
}
