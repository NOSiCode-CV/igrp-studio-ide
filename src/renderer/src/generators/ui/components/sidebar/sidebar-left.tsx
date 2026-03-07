import {
    IGRPCollapsibleContentPrimitive,
    IGRPCollapsiblePrimitive,
    IGRPCollapsibleTriggerPrimitive,
    IGRPScrollAreaPrimitive,
    IGRPScrollBarPrimitive,
    IGRPSidebarContentPrimitive,
    IGRPSidebarFooterPrimitive,
    IGRPSidebarGroupContentPrimitive,
    IGRPSidebarGroupLabelPrimitive,
    IGRPSidebarGroupPrimitive,
    IGRPSidebarHeaderPrimitive,
    IGRPSidebarInputPrimitive,
    IGRPSidebarMenuButtonPrimitive,
    IGRPSidebarMenuItemPrimitive,
    IGRPSidebarMenuPrimitive,
    IGRPSidebarPrimitive,
    IGRPSidebarTriggerPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipTriggerPrimitive,
    useIGRPSidebarPrimitive
} from '@igrp/igrp-framework-react-design-system'
import FileExplorerSidebar from '@renderer/components/fileExplorer'
import { GitCommitsSidebar } from '@renderer/components/git/git-list-commits'
import { KeyboardKey, SHORTCUTS } from '@renderer/constants/shortcut'
//import SidebarAppComponents from './sidebar-app-components';
import { useKeyPress } from '@renderer/hooks/useKeyDown'
import Draggable from '@renderer/lib/dnd/Draggable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { ROUTES } from '@renderer/routes/routeConstants'
import { filterSubItems } from '@renderer/utils'
import {
    AlertTriangle,
    Badge,
    ChevronRight,
    FileText,
    FolderTree,
    GitBranch,
    GripHorizontal,
    Home,
    ListTodo,
    SquareFunction
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MenuItem } from 'src/main/types'
import { CustomCodeMenu, SidebarAppCustomCode } from './custom-code/sidebar-app-custom-code'
import NavigatorSidebar from './sidebar-navigator'

type AppSidebarProps = React.ComponentProps<typeof IGRPSidebarPrimitive> & {
    data: Array<any>
    basePath: string
}

export function AppSidebar({
    data: initialData,
    basePath,
    ...props
}: AppSidebarProps): React.ReactNode {
    const { setOpen } = useIGRPSidebarPrimitive()
    const { t } = useTranslation()

    const [activeMenuGroup, setActiveMenuGroup] = useState<MenuItem>({
        icon: ListTodo,
        label: t('widgetPalette'),
        id: 'widgetPalette'
    })

    const searchInputRef = useRef<HTMLInputElement>(null)

    const [filteredData, setFilteredData] = useState(initialData)

    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        setFilteredData(filterSubItems(initialData, searchQuery))
    }, [searchQuery, initialData])

    useKeyPress(() => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
    }, [KeyboardKey.find])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchQuery(e.target.value)
    }

    const handleNavegationClick = (item: MenuItem): void => {
        setActiveMenuGroup(item)
    }

    const navegations: MenuItem[] = [
        { icon: ListTodo, label: t('widgetPalette'), id: 'widgetPalette' },
        { icon: SquareFunction, label: t('Custom Code'), id: 'customCode' },
        { icon: FolderTree, label: t('navigator'), id: 'navigator' },
        { icon: FileText, label: t('explorer'), id: 'explorer' },
        { icon: Badge, label: t('settings'), id: 'settings' },
        { icon: GitBranch, label: t('git'), id: 'git' }
    ]

    return (
        <IGRPSidebarPrimitive
            collapsible="icon"
            className={cn(
                'overflow-hidden *:data-[sidebar=sidebar]:flex-row top-(--header-height-two)! h-[calc(100svh-var(--header-height-three))]! group-data-[side=left]:border-r-0',
                props.className
            )}
            {...props}
        >
            {/* First Sidebar */}
            <IGRPSidebarPrimitive
                collapsible="none"
                className={cn('w-[calc(var(--sidebar-width-icon)+1px)]! border-r', 'w-20!')}
            >
                <IGRPSidebarHeaderPrimitive className="pr-0">
                    <IGRPSidebarMenuPrimitive>
                        <IGRPSidebarMenuItemPrimitive>
                            <IGRPSidebarMenuButtonPrimitive
                                size="lg"
                                asChild
                                className="md:h-8 md:p-0 items-center justify-center"
                            >
                                <a href={ROUTES.HOME}>
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <Home className="size-4" />
                                    </div>
                                </a>
                            </IGRPSidebarMenuButtonPrimitive>
                        </IGRPSidebarMenuItemPrimitive>
                    </IGRPSidebarMenuPrimitive>
                </IGRPSidebarHeaderPrimitive>
                <IGRPSidebarContentPrimitive className="overflow-hidden ">
                    <IGRPSidebarGroupPrimitive>
                        <IGRPSidebarGroupContentPrimitive className="md:px-0">
                            <IGRPSidebarMenuPrimitive>
                                {navegations.map((item) => (
                                    <IGRPSidebarMenuItemPrimitive key={item.id}>
                                        <IGRPSidebarMenuButtonPrimitive
                                            tooltip={{
                                                children: t(item.label),
                                                hidden: false
                                            }}
                                            onClick={() => {
                                                setOpen(true)
                                                handleNavegationClick(item)
                                            }}
                                            isActive={activeMenuGroup.id === item.id}
                                            size="lg"
                                            className={cn(
                                                'px-2.5 md:px-2 flex flex-col h-auto rounded-lg truncate',
                                                item.id === activeMenuGroup.id && 'text-primary'
                                            )}
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center">
                                                <item.icon size={20} />
                                            </div>
                                            <span className="w-16 text-xs text-center block text-ellipsis overflow-hidden whitespace-nowrap truncate">
                                                {item.label}
                                            </span>
                                        </IGRPSidebarMenuButtonPrimitive>
                                    </IGRPSidebarMenuItemPrimitive>
                                ))}
                            </IGRPSidebarMenuPrimitive>
                        </IGRPSidebarGroupContentPrimitive>
                    </IGRPSidebarGroupPrimitive>
                </IGRPSidebarContentPrimitive>
                <IGRPSidebarFooterPrimitive className="items-center justify-center">
                    <IGRPSidebarTriggerPrimitive className="items-center justify-center" />
                </IGRPSidebarFooterPrimitive>
            </IGRPSidebarPrimitive>

            {/* Second Sidebar */}
            <IGRPSidebarPrimitive collapsible="none" className="hidden flex-1 md:flex">
                <IGRPSidebarHeaderPrimitive className="gap-3.5 border-b">
                    <div className="flex w-full items-center justify-between max-w-72">
                        <div className="flex flex-1 space-x-2  items-center">
                            <activeMenuGroup.icon size={20} />
                            <div className="text-base font-medium text-foreground">
                                {t(activeMenuGroup.label)}
                            </div>
                        </div>
                        {activeMenuGroup.id === 'customCode' && <CustomCodeMenu />}
                    </div>
                    <IGRPSidebarInputPrimitive
                        placeholder={`Search (${SHORTCUTS.FIND})`}
                        value={searchQuery}
                        onChange={handleInputChange}
                        ref={searchInputRef}
                    />
                </IGRPSidebarHeaderPrimitive>
                <IGRPSidebarContentPrimitive className="overflow-hidden">
                    <IGRPScrollAreaPrimitive className="h-[calc(100vh-230px)] w-[300px]">
                        {activeMenuGroup.id === 'explorer' ? (
                            <FileExplorerSidebar basePath={basePath} searchTerm={searchQuery} />
                        ) : activeMenuGroup.id === 'navigator' ? (
                            <NavigatorSidebar basePath={basePath} searchTerm={searchQuery} />
                        ) : activeMenuGroup.id === 'git' ? (
                            <GitCommitsSidebar
                                basePath={basePath}
                                onSelectCommit={(commit) => {
                                    console.log('Selected Commit:', commit)
                                    // Optional: Handle commit selection
                                }}
                            />
                        ) : activeMenuGroup.id === 'customCode' ? (
                            <SidebarAppCustomCode searchTerm={searchQuery} />
                        ) : (
                            filteredData.map((item, index) => (
                                <IGRPCollapsiblePrimitive
                                    key={index}
                                    title={item.label}
                                    defaultOpen
                                    className="group/collapsible"
                                >
                                    <IGRPSidebarGroupPrimitive>
                                        <IGRPSidebarGroupLabelPrimitive
                                            asChild
                                            className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                        >
                                            <IGRPCollapsibleTriggerPrimitive>
                                                {item.label}
                                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                            </IGRPCollapsibleTriggerPrimitive>
                                        </IGRPSidebarGroupLabelPrimitive>
                                        <IGRPCollapsibleContentPrimitive>
                                            <IGRPSidebarGroupContentPrimitive>
                                                <IGRPSidebarMenuPrimitive className="grid grid-cols-2 gap-3 p-3 rounded-lg">
                                                    {item.subItems.map(
                                                        (subItem: MenuItem, key: number) => (
                                                            <IGRPSidebarMenuItemPrimitive
                                                                key={key}
                                                                className="flex flex-col items-center justify-center bg-muted rounded-md shadow-xs"
                                                            >
                                                                <Draggable
                                                                    item={
                                                                        subItem as StructuredComponent
                                                                    }
                                                                    className="w-full h-full p-2 rounded-lg cursor-move flex flex-col items-center gap-2 shadow-sm border text-xs border-gray-200 hover:shadow-md transition-shadow duration-200 bg-card relative"
                                                                    dropZone={false}
                                                                    type={item.type}
                                                                >
                                                                    {subItem.deprecated && (
                                                                        <IGRPTooltipPrimitive>
                                                                            <IGRPTooltipTriggerPrimitive
                                                                                asChild
                                                                            >
                                                                                <span className="absolute right-2 top-2 text-amber-500">
                                                                                    <AlertTriangle className="h-4 w-4" />
                                                                                </span>
                                                                            </IGRPTooltipTriggerPrimitive>
                                                                            <IGRPTooltipContentPrimitive>
                                                                                <p>
                                                                                    {t(
                                                                                        'Deprecated component'
                                                                                    )}
                                                                                </p>
                                                                            </IGRPTooltipContentPrimitive>
                                                                        </IGRPTooltipPrimitive>
                                                                    )}
                                                                    <GripHorizontal className="w-4 h-4 text-gray-400" />

                                                                    <div className="flex flex-col items-center gap-2">
                                                                        {subItem.icon && (
                                                                            <subItem.icon className="w-6 h-6" />
                                                                        )}
                                                                        <span className="text-center">
                                                                            {subItem.label}
                                                                        </span>
                                                                    </div>
                                                                </Draggable>
                                                            </IGRPSidebarMenuItemPrimitive>
                                                        )
                                                    )}
                                                </IGRPSidebarMenuPrimitive>
                                            </IGRPSidebarGroupContentPrimitive>
                                        </IGRPCollapsibleContentPrimitive>
                                    </IGRPSidebarGroupPrimitive>
                                </IGRPCollapsiblePrimitive>
                            ))
                        )}
                        <IGRPScrollBarPrimitive orientation="horizontal" />
                    </IGRPScrollAreaPrimitive>
                </IGRPSidebarContentPrimitive>
            </IGRPSidebarPrimitive>
        </IGRPSidebarPrimitive>
    )
}
