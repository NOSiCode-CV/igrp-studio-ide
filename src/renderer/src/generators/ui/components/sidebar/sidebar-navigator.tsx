import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub
} from '@renderer/components/ui/sidebar'
import { type TabItem, useTabs } from '@renderer/components/navigation/TabContext'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { ChevronRight, File, Folder } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'

interface FileExplorerSidebarProps {
    basePath: string
    searchTerm: string
}

const NavigatorSidebar: React.FC<FileExplorerSidebarProps> = ({ searchTerm }) => {
    const { getActiveTab } = useTabs()

    // Initialize fileTree as an array of StructuredComponent
    const [fileTree, setFileTree] = useState<StructuredComponent[]>([])

    const selectStudioState = (state: any) => state.PageBuilder
    const selectStudioProperties = createSelector(selectStudioState, (studio) => ({
        changeStatus: studio.changeStatus
    }))

    const { changeStatus } = useSelector(selectStudioProperties)

    useEffect(() => {
        const getJsonData = async () => {
            try {
                const tab: TabItem = getActiveTab()
                const path = tab.item?.path

                const data = await window.api.getJsonContent(path)
                if (data.components) {
                    setFileTree([data.components])
                }
            } catch (error) {
                console.error('Failed to load JSON content:', error)
            }
        }
        getJsonData()
    }, [getActiveTab, changeStatus])

    const handleFileSelect = (item: StructuredComponent) => {
        console.log(item)
    }

    const filterTree = (tree: StructuredComponent[], term: string): StructuredComponent[] => {
        return tree
            .filter((item) => {
                // Use componentName or label for filtering
                const name = item.componentName || item.label || ''
                return name.toLowerCase().includes(term.toLowerCase())
            })
            .map((item) => ({
                ...item,
                children: item.children ? filterTree(item.children, term) : []
            }))
    }

    const renderTree = (tree: StructuredComponent[]) => {
        const filteredTree = searchTerm ? filterTree(tree, searchTerm) : tree
        return filteredTree.map((item) => (
            <SidebarMenuItem key={item.id}>
                {item.children && item.children.length > 0 ? (
                    <Collapsible defaultOpen={true}>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                className="justify-between"
                                onClick={() => handleFileSelect(item)}
                            >
                                <div className="flex items-center space-x-2">
                                    <ChevronRight className="w-4 h-4 transition-transform transform group-data-[state=open]/collapsible:rotate-90" />
                                    <Folder className="w-4 h-4" />
                                    <span>{item.componentName || item.label}</span>
                                </div>
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>{renderTree(item.children)}</SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                ) : (
                    <SidebarMenuButton onClick={() => handleFileSelect(item)}>
                        <div className="flex items-center gap-2">
                            <File className="w-4 h-4" />
                            <span>{item.componentName || item.label}</span>
                        </div>
                    </SidebarMenuButton>
                )}
            </SidebarMenuItem>
        ))
    }

    return (
        <ScrollArea className="flex-1 p-2">
            <SidebarMenu>{renderTree(fileTree)}</SidebarMenu>
        </ScrollArea>
    )
}

export default NavigatorSidebar
