import { useState } from 'react';
import classnames from 'classnames';
import FormEngine from '../FormEngine';
import { File } from 'src/main/types';
import { DroppedComponentsProvider } from '../dnd/DroppedComponentsContext';
import MainPageBuilder from '../page/list-pages';
import { Layers2, X } from 'lucide-react';
import { Separator } from '@renderer/components/ui/separator';

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

  const handleClickOpenGerador = (pageFile: File) => {
    onPageClick(pageFile.name);
    setCurrentPage(pageFile);
  };

  return (
    <div className="navigation-page">
      <div className='sticky top-10'>
        <nav className="flex border-t border-gray-200 ">
          {tabs.map((tab) => (
            <div key={tab}>
              <button
                className={classnames(
                  'px-4 py-2 text-sm font-medium focus:outline-none',
                  {
                    'bg-white text-blue-600 border-t border-l border-r': activeTab === tab,
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
                      className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <X className='h-4' />
                    </button>
                  </div>
                ) : (
                  <Layers2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </nav>
        <Separator />
      </div>
      {tabs.map((tab) => (
        <div key={tab} className={activeTab === tab ? 'block' : 'hidden'}>
          {tab === 'PageBuilder' ? (
            <MainPageBuilder onPageClick={handleClickOpenGerador} />
          ) : (
            <DroppedComponentsProvider>
              <FormEngine basePath={basePath} page={tab} pagePath={currentPage?.path} />
            </DroppedComponentsProvider>
          )}
        </div>
      ))}
    </div>
  );
}