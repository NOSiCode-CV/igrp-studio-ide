import React, { useRef } from 'react'
import classnames from 'classnames'
import { Plus, X } from 'lucide-react'
import { Separator } from '@renderer/components/ui/separator'
import { Button } from './ui/button'
import PageController from '@renderer/generators/api/PageController'
import { OptionType } from '@renderer/constants/appConstants'
import { cn } from '@renderer/lib/utils'
import Overview from '@renderer/generators/api/overview'
import { ScrollArea, ScrollBar } from './ui/scroll-area'

export interface TabItem {
  id: string
  title: string
  open: OptionType
  item?: any
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
  tabs,
  activeTab,
  setActiveTab,
  setNewTab,
  onCloseTab
}: ContentProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

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

  const handleOpenNew = (tab: TabItem) => {
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
            <div className="flex items-center  whitespace-nowrap">
              {tabs.map((tab) => (
                <React.Fragment key={tab.id}>
                  <div
                    className={classnames(
                      'px-4 h-10 text-sm font-medium focus:outline-none cursor-pointer align-middle flex',
                      {
                        'text-igrp border-t-2 border-igrp': activeTab === tab.id
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
      {tabs.map((tab) => {
        return (
          <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
            {tab.id === 'tab-0' ? (
              <Overview onOpenNew={handleOpenNew} open={tab.open} />
            ) : (
              <PageController
                onOpenNew={handleOpenNew}
                open={tab.open}
                tab={tab}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export default TabManager
