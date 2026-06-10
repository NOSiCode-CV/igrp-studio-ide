import { TAB_DEFAULT, useTabs } from '@renderer/components/navigation/TabContext'
import TabsNavigation from '@renderer/components/navigation/tabs-navigation'
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import { APRESENTATION, OPTION_TYPE } from '@renderer/constants/appConstants'
import { DragProvider } from '@renderer/features/dnd/drag-drop-context'
import { ContainerScrollArea } from '@renderer/generators/api/components/ContainerScrollArea'
import { EditorLayout } from '@renderer/generators/api/pages/EditorLayout'
import { cn } from '@renderer/lib/utils'
import { useRef, useState } from 'react'
import type { FileTree } from 'src/main/types'
import PageManager, { type PageDefinition } from '../browser/page-manager'
import { convertFileTreeToPageDefinition } from '../browser/processes/utils/bpmn-helpers'
import { DroppedComponentsProvider } from '../contexts/EditorContext'
import FormEngine from '../page-builder'
import NavigationBar from './NavigationBar'

interface ContentProps {
    basePath: string
}

interface FormEngineRef {
    handleSave: () => Promise<void>
}

export default function TabManager({ basePath }: ContentProps): React.JSX.Element {
    const { activeTab, tabs, initializeTabFromCurrentItem, setActiveTab, newTab } = useTabs()

    const [activePresentation, setAtivePresentation] = useState<{
        [key: string]: string
    }>({})

    const formEngineRefs = useRef<{
        [key: string]: FormEngineRef | null
    }>({})

    const handleClickOpenGerador = (page: PageDefinition | FileTree): void => {
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
        <div className="flex-1 min-w-0">
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

            <SidebarProvider
                style={
                    {
                        '--sidebar-width': '380px'
                    } as React.CSSProperties
                }
            >
                <div className="flex flex-1 min-w-0">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={cn(
                                'flex flex-1 min-w-0',
                                activeTab === tab.id ? 'block' : 'hidden'
                            )}
                        >
                            {tab.id === TAB_DEFAULT ? (
                                <SidebarInset>
                                    <ContainerScrollArea>
                                        <PageManager onPageClick={handleClickOpenGerador} />
                                    </ContainerScrollArea>
                                </SidebarInset>
                            ) : tab.open === OPTION_TYPE.FILE_THREE ? (
                                <EditorLayout currentItem={tab.item} />
                            ) : (
                                // One independent store PER TAB — each open page
                                // owns its own state, so editing/switching never
                                // leaks or loses another tab's unsaved content.
                                <DroppedComponentsProvider>
                                    <DragProvider>
                                        <FormEngine
                                            ref={(ref) => {
                                                formEngineRefs.current[tab.id] = ref
                                            }}
                                            basePath={basePath}
                                            page={tab.item}
                                            activePresentation={
                                                activePresentation[tab.id] ?? APRESENTATION.DESIGN
                                            }
                                            onSave={handleSave}
                                        />
                                    </DragProvider>
                                </DroppedComponentsProvider>
                            )}
                        </div>
                    ))}
                </div>
            </SidebarProvider>
        </div>
    )
}
