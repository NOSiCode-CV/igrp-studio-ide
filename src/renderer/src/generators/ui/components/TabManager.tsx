import { useRef, useState } from 'react';
import classnames from 'classnames';
import FormEngine from '../FormEngine';
import { File } from 'src/main/types';
import { DroppedComponentsProvider } from '../dnd/DroppedComponentsContext';
import MainPageBuilder from '../page/list-pages';
import { Layers2, X } from 'lucide-react';
import { Separator } from '@renderer/components/ui/separator';
import NavigationBar from './NavigationBar';

interface ContentProps {
    basePath?: string;
    tabs: string[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onPageClick: (page: string) => void;
    onCloseTab: (tab: string) => void;
}

export default function Component({
    basePath,
    tabs,
    activeTab,
    setActiveTab,
    onPageClick,
    onCloseTab
}: ContentProps) {
    const [currentPage, setCurrentPage] = useState<File | null>(null);

    // Track the isDesign state for each tab
    const [isDesignStates, setIsDesignStates] = useState<{ [key: string]: boolean }>({});

    // Ref to hold the handleSave function from FormEngine
    const formEngineRefs = useRef<{ [key: string]: { handleSave: () => void } | null }>({});

    const handleClickOpenGerador = (pageFile: File) => {
        onPageClick(pageFile.name);
        setCurrentPage(pageFile);
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

    console.log("tabs", tabs)

    return (
        <>
            <nav className="flex justify-between border-t border-gray-200 pr-6">
                <div className="flex">
                    {tabs.map((tab) => (

                        <div key={tab}
                            className={classnames(
                                'px-4 py-2 text-sm font-medium focus:outline-none cursor-pointer',
                                {
                                    'bg-white text-[#3AA0D9] border-t-2 border-[#3AA0D9]': activeTab === tab,
                                    'text-gray-500 hover:text-gray-700 bg-gray-100': activeTab !== tab
                                }
                            )}
                            onClick={() => setActiveTab(tab)}
                            >
                            {tab !== 'PageBuilder' ? (
                                <div className="flex items-center">
                                    <span>{tab}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCloseTab(tab);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        <X className='h-3' />
                                    </button>
                                </div>
                            ) : (
                                <button>
                                    <Layers2 className="w-4 h-4" /></button>
                            )}
                        </div>
                    ))}
                </div>
                {activeTab !== 'PageBuilder' && <NavigationBar isDesign={isDesignStates[activeTab] ?? true} onSave={handleSave} onSwitch={handleSwitchClick} />}
            </nav>
            <Separator />
            {tabs.map((tab) => (
                <div key={tab} className={activeTab === tab ? 'block' : 'hidden'}>
                    {tab === 'PageBuilder' ? (
                        <MainPageBuilder onPageClick={handleClickOpenGerador} />
                    ) : (
                        <DroppedComponentsProvider>
                            <FormEngine
                                ref={(ref) => (formEngineRefs.current[tab] = ref)}
                                basePath={basePath}
                                page={tab}
                                pagePath={currentPage?.path}
                                isDesign={isDesignStates[tab] ?? true}
                                onSave={handleSave}
                            />
                        </DroppedComponentsProvider>
                    )}
                </div>
            ))}
        </>
    );
}