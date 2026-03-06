import { useRef, useState } from 'react'
import FormEngine from '../page-builder'
import { DroppedComponentsProvider } from '../dnd/DroppedComponentsContext'
import PageManager, { PageDefinition } from '../page/page-manager'
import NavigationBar from './NavigationBar'
import { cn } from '@renderer/lib/utils'
import { TAB_DEFAULT, useTabs } from '@renderer/components/navigation/TabContext'
import TabsNavigation from '@renderer/components/navigation/tabs-navigation'
import { DragProvider } from '@renderer/lib/dnd/drag-drop-context'
import { ContainerScrollArea } from '@renderer/generators/api/components/ContainerScrollArea'
import { EditorLayout } from '@renderer/generators/api/pages/EditorLayout'
import { APRESENTATION, OPTION_TYPE } from '@renderer/constants/appConstants'
import {
  IGRPSidebarInsetPrimitive,
  IGRPSidebarProviderPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { FileTree } from 'src/main/types'
import { convertFileTreeToPageDefinition } from '../page/utils/bpmn-helpers'

interface ContentProps {
  basePath: string
}

interface FormEngineRef {
  handleSave: () => Promise<void>
}

export default function TabManager({ basePath }: ContentProps): React.JSX.Element {
  const { activeTab, tabs, initializeTabFromCurrentItem, setActiveTab, newTab } = useTabs()

  // Track the isDesign state for each tab
  const [activePresentation, setAtivePresentation] = useState<{
    [key: string]: string
  }>({})

  // Ref to hold the handleSave function from FormEngine
  const formEngineRefs = useRef<{
    [key: string]: FormEngineRef | null
  }>({})

  const handleClickOpenGerador = (page: PageDefinition | FileTree): void => {
    // Check if it's a FileTree without proper content
    const pageDefinition =
      'content' in page && page.content
        ? (page as PageDefinition)
        : convertFileTreeToPageDefinition(page as FileTree)

    initializeTabFromCurrentItem({
      ...pageDefinition,
      label:
        pageDefinition.content?.description ||
        pageDefinition.content?.pageName ||
        pageDefinition.name,
      id: pageDefinition.content?.id || pageDefinition.id
    })
  }

  const handleSave = async (): Promise<void> => {
    await formEngineRefs.current[activeTab]?.handleSave()
  }

  const handleSwitchClick = (activePresentation: string): void => {
    setAtivePresentation((prevState) => ({
      ...prevState,
      [activeTab]: activePresentation
    }))
  }

  return (
    <div className="flex-1">
      <TabsNavigation
        tabs={tabs}
        activeTab={activeTab}
        newTab={newTab}
        setActiveTab={setActiveTab}
        btnNew={false}
      >
        {activeTab !== TAB_DEFAULT && (
          <NavigationBar
            activePresentation={activePresentation[activeTab] ?? APRESENTATION.DESIGN}
            onSave={handleSave}
            onSwitch={handleSwitchClick}
            page={activeTab}
            basePath={basePath}
          />
        )}
      </TabsNavigation>

      {tabs.map((tab) => (
        <div key={tab.id} className={cn('flex flex-1', activeTab === tab.id ? 'block' : 'hidden')}>
          {tab.id === TAB_DEFAULT ? (
            <IGRPSidebarInsetPrimitive>
              <ContainerScrollArea>
                <PageManager onPageClick={handleClickOpenGerador} />
              </ContainerScrollArea>
            </IGRPSidebarInsetPrimitive>
          ) : (
            <DroppedComponentsProvider>
              <IGRPSidebarProviderPrimitive
                style={
                  {
                    '--sidebar-width': '380px'
                  } as React.CSSProperties
                }
              >
                {tab.open === OPTION_TYPE.FILE_THREE ? (
                  <EditorLayout currentItem={tab.item} />
                ) : (
                  <DragProvider>
                    <FormEngine
                      ref={(ref) => {
                        formEngineRefs.current[tab.id] = ref
                      }}
                      basePath={basePath}
                      page={tab.item}
                      activePresentation={activePresentation[tab.id] ?? APRESENTATION.DESIGN}
                      onSave={handleSave}
                    />
                  </DragProvider>
                )}
              </IGRPSidebarProviderPrimitive>
            </DroppedComponentsProvider>
          )}
        </div>
      ))}
    </div>
  )
}
