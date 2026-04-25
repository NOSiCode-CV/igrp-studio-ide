import {
    IGRPSidebarInsetPrimitive,
    IGRPSidebarProviderPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { TAB_DEFAULT, useTabs } from '@renderer/components/navigation/TabContext'
import TabsNavigation from '@renderer/components/navigation/tabs-navigation'
import { APRESENTATION, OPTION_TYPE } from '@renderer/constants/appConstants'
import { ContainerScrollArea } from '@renderer/generators/api/components/ContainerScrollArea'
import { EditorLayout } from '@renderer/generators/api/pages/EditorLayout'
import { DragProvider } from '@renderer/lib/dnd/drag-drop-context'
import { cn } from '@renderer/lib/utils'
import { useEffect, useRef, useState } from 'react'
import type { FileTree } from 'src/main/types'
import {
    DroppedComponentsProvider,
    useDroppedComponents,
    useDroppedComponentsAdmin
} from '../dnd/DroppedComponentsContext'
import PageManager, { type PageDefinition } from '../page/page-manager'
import { convertFileTreeToPageDefinition } from '../page/utils/bpmn-helpers'
import FormEngine from '../page-builder'
import NavigationBar from './NavigationBar'
import SidebarRight from './sidebar/sidebar-right'

interface ContentProps {
    basePath: string
}

interface FormEngineRef {
    handleSave: () => Promise<void>
}

/**
 * Renders SidebarRight when the currently active tab has a component selected.
 * Lives at the TabManager level so we have a single instance across tabs.
 */
function SidebarRightSlot() {
    const { currentComponent } = useDroppedComponents()
    if (!currentComponent) return null
    return <SidebarRight />
}

/**
 * Subscribes to the tabs list and drops state slices for tabs that no longer
 * exist. Keeps the DroppedComponentsContext from leaking memory across opens.
 */
function TabsCleanup({ tabIds }: { tabIds: string[] }) {
    const { removeTab } = useDroppedComponentsAdmin()
    const knownRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const current = new Set(tabIds)
        knownRef.current.forEach((id) => {
            if (!current.has(id)) removeTab(id)
        })
        knownRef.current = current
    }, [tabIds, removeTab])

    return null
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

            <IGRPSidebarProviderPrimitive
                style={
                    {
                        '--sidebar-width': '380px'
                    } as React.CSSProperties
                }
            >
                <DroppedComponentsProvider activeTabId={activeTab}>
                    <TabsCleanup tabIds={tabs.map((t) => t.id)} />
                    <div className="flex flex-1">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={cn(
                                    'flex flex-1',
                                    activeTab === tab.id ? 'block' : 'hidden'
                                )}
                            >
                                {tab.id === TAB_DEFAULT ? (
                                    <IGRPSidebarInsetPrimitive>
                                        <ContainerScrollArea>
                                            <PageManager onPageClick={handleClickOpenGerador} />
                                        </ContainerScrollArea>
                                    </IGRPSidebarInsetPrimitive>
                                ) : tab.open === OPTION_TYPE.FILE_THREE ? (
                                    <EditorLayout currentItem={tab.item} />
                                ) : (
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
                                )}
                            </div>
                        ))}
                        <SidebarRightSlot />
                    </div>
                </DroppedComponentsProvider>
            </IGRPSidebarProviderPrimitive>
        </div>
    )
}
