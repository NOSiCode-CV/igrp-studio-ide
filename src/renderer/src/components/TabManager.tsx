import React, { useRef, useState } from 'react'
import classnames from 'classnames'
import { File } from 'src/main/types'
import { Plus, X } from 'lucide-react'
import { Separator } from '@renderer/components/ui/separator'
import { Button } from './ui/button'
import New from '@renderer/generators/api/new'
import { OptionType } from '@renderer/constants/appConstants'
import { cn } from '@renderer/lib/utils'
import Overview from '@renderer/generators/api/overview'
import { ScrollArea, ScrollBar } from './ui/scroll-area'

export interface TabItem {
  id: string
  title: string
  open: OptionType
}

interface ContentProps {
  basePath?: string
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: string) => void
  setNewTab: (tab: TabItem) => void
  onCloseTab: (tab: string) => void
}

const TabManager = ({
  basePath,
  tabs,
  activeTab,
  setActiveTab,
  setNewTab,
  onCloseTab
}: ContentProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [currentPage, setCurrentPage] = useState<File | null>(null)
  const formEngineRefs = useRef<{ [key: string]: { handleSave: () => void } | null }>({})

  // Handle opening a new tab
  const handleNewTab = () => {
    const newTabId = `tab-${tabs.length + 1}`
    setNewTab({ id: newTabId, title: `New...`, open: 'none' })
    setTimeout(() => {
      scrollAreaRef.current?.scrollTo({
        left: scrollAreaRef.current.scrollWidth,
        behavior: 'smooth'
      })
    }, 0)
  }

  // Handle saving changes in the current tab
  const handleSave = () => {
    formEngineRefs.current[activeTab]?.handleSave()
  }

  const handleOpenNew = (tab: TabItem) => {
    console.log(tab)
    setNewTab({
      ...tab
    })
  }

  return (
    <>
      {/* Tabs Navigation */}
      <nav className="flex justify-between">
          <div className="flex flex-1 w-[100px]">
            <ScrollArea ref={scrollAreaRef}>
              <div className="flex items-center">
                {tabs.map((tab) => (
                  <React.Fragment key={tab.id}>
                    <div
                      className={classnames(
                        'px-4 h-10 text-sm font-medium focus:outline-none cursor-pointer align-middle flex',
                        {
                          'bg-white text-[#3AA0D9] border-t-2 border-[#3AA0D9]':
                            activeTab === tab.id
                        }
                      )}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <div className="flex items-center space-x-1 group/tab">
                        <span>{tab.title}</span>
                        {tab.id !== 'tab-0' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              onCloseTab(tab.id)
                            }}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'opacity-0 group-hover/tab:opacity-100 size-4',
                              tab.id === 'tab-0' ? 'invisible' : ''
                            )}
                          >
                            <X className="h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Separator orientation="vertical" className="mr-2 h-4" />
                  </React.Fragment>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <div className="flex items-center px-2 gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNewTab}>
                <Plus className="h-4 w-4" />
                <span className="sr-only">New Endpoint</span>
              </Button>
            </div>
          </div>
        </nav>

      <Separator />

      {/* Tab Content */}
      {tabs.map((tab) => (
        <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
          {tab.id === 'tab-0' ? (
            <Overview onOpenNew={handleOpenNew} open={tab.open} />
          ) : (
            <New onOpenNew={handleOpenNew} open={tab.open} tab={tab} />
          )}
        </div>
      ))}
    </>
  )
}

export default TabManager
