import {
  IGRPSidebarPrimitive,
  IGRPSidebarContentPrimitive,
  IGRPSidebarFooterPrimitive,
  IGRPSidebarGroupPrimitive,
  IGRPSidebarGroupContentPrimitive,
  IGRPSidebarHeaderPrimitive,
  IGRPSidebarMenuPrimitive,
  IGRPSidebarMenuButtonPrimitive,
  IGRPSidebarMenuItemPrimitive,
  IGRPSidebarMenuSubPrimitive,
  IGRPSidebarTriggerPrimitive,
  useIGRPSidebar,
  IGRPCollapsiblePrimitive,
  IGRPCollapsibleContentPrimitive,
  IGRPCollapsibleTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { ChevronRight, FileText, GitBranch, Home, Server } from 'lucide-react'

import { cn } from '@renderer/lib/utils'
import { filterSubItems } from '@renderer/utils'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProjectData, MenuItem } from 'src/main/types'
import {
  IGRPScrollAreaPrimitive,
  IGRPScrollBarPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { AppSidebarHeader } from './app-sidebar-header'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@renderer/routes/routeConstants'
import { GitCommitsSidebar } from '@renderer/components/git/git-list-commits'
import FileExplorerIGRPSidebar from '@renderer/components/fileExplorer'
import { DropdownSidebarMenuButton } from './dropdown-sidebar'

interface AppIGRPSidebarProps {
  className?: string
  menuItems: MenuItem[]
  config?: ProjectData
  basePath: string
  header?: boolean
}

export function AppIGRPSidebar({
  className,
  menuItems,
  config,
  basePath,
  header
}: AppIGRPSidebarProps): React.ReactNode {
  const { t } = useTranslation()
  const { setOpen } = useIGRPSidebar()
  const { state: sidebarState } = useIGRPSidebar()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeItem, setActiveItem] = useState('')

  const menuApp = useMemo(() => filterSubItems(menuItems, searchQuery), [menuItems, searchQuery])
  const [activeMenuGroup, setActiveMenuGroup] = useState(t('apis'))

  // Derive activeMenu from activeMenuGroup instead of using state
  const activeMenu = useMemo(() => {
    if (activeMenuGroup === t('apis')) {
      return menuApp || []
    }
    return []
  }, [activeMenuGroup, menuApp, t])

  const handleSearch = (value: string): void => {
    setSearchQuery(value)
  }

  const handleSubItemClick = (e: React.MouseEvent, subItem: MenuItem): void => {
    e.preventDefault()
    if (subItem.click) {
      subItem.click(subItem)
    }
    setActiveItem(subItem.label)
  }

  const handleClickMenu = (item: MenuItem): void => {
    setActiveMenuGroup(item.label)
  }

  const menuIcons: MenuItem[] = [
    { icon: Server, label: t('apis'), id: 'apis' },
    { icon: FileText, label: t('explorer'), id: 'explorer' },
    { icon: GitBranch, label: t('git'), id: 'git' }
  ]

  return (
    <>
      <IGRPSidebarPrimitive
        collapsible="icon"
        className={cn(
          'overflow-hidden *:data-[sidebar=sidebar]:flex-row top-(--header-height)! h-[calc(100svh-var(--header-height-two))] group-data-[side=left]:border-r-0',
          className
        )}
      >
        {/* First IGRPSidebar */}
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
          <IGRPSidebarContentPrimitive>
            <IGRPSidebarGroupPrimitive>
              <IGRPSidebarGroupContentPrimitive className="md:px-0">
                <IGRPSidebarMenuPrimitive>
                  {menuIcons.map((item, index) => (
                    <IGRPSidebarMenuItemPrimitive key={index}>
                      <IGRPSidebarMenuButtonPrimitive
                        tooltip={{
                          children: item.label,
                          hidden: false
                        }}
                        onClick={() => {
                          setOpen(true)
                          handleClickMenu(item)
                        }}
                        isActive={item.label === activeMenuGroup}
                        size="lg"
                        className={cn(
                          'px-2.5 md:px-2 flex flex-col h-auto rounded-lg truncate',
                          item.label === activeMenuGroup ? 'text-primary' : ''
                        )}
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          <item.icon size={20} />
                        </div>
                        <span className="w-16 text-xs text-center text-ellipsis truncate">
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

        {/* Second IGRPSidebar */}
        <IGRPSidebarPrimitive collapsible="none" className="hidden flex-1 md:flex">
          {header && (
            <AppSidebarHeader
              name={config?.name}
              description={activeMenuGroup}
              basePath={basePath}
              sidebarState={sidebarState}
              handleSearch={handleSearch}
            />
          )}
          <IGRPSidebarContentPrimitive>
            <IGRPScrollAreaPrimitive className="w-[300px]">
              <div className="flex">
                {activeMenuGroup === 'Explorer' ? (
                  <FileExplorerIGRPSidebar basePath={basePath} searchTerm={searchQuery} />
                ) : activeMenuGroup === 'Git' ? (
                  <GitCommitsSidebar
                    basePath={basePath}
                    onSelectCommit={() => {
                      void 0
                    }}
                  />
                ) : (
                  <IGRPSidebarGroupPrimitive>
                    <IGRPSidebarGroupContentPrimitive>
                      {activeMenu.map((item: MenuItem, index: number) => (
                        <IGRPSidebarMenuPrimitive key={index}>
                          <Three
                            key={index}
                            level={index}
                            item={item}
                            handleSubItemClick={handleSubItemClick}
                            activeItem={activeItem}
                            basePath={basePath}
                            activeMenuGroup={activeMenuGroup}
                          />
                        </IGRPSidebarMenuPrimitive>
                      ))}
                    </IGRPSidebarGroupContentPrimitive>
                  </IGRPSidebarGroupPrimitive>
                )}
              </div>
              <IGRPScrollBarPrimitive orientation="horizontal" />
            </IGRPScrollAreaPrimitive>
          </IGRPSidebarContentPrimitive>
        </IGRPSidebarPrimitive>
      </IGRPSidebarPrimitive>
    </>
  )
}

const Three = React.memo(
  ({
    level,
    item,
    handleSubItemClick,
    activeItem,
    basePath,
    activeMenuGroup
  }: {
    level: number
    item: MenuItem
    handleSubItemClick: (e: React.MouseEvent, subItem: MenuItem) => void
    activeItem: string
    basePath: string
    activeMenuGroup?: string
  }): React.ReactNode => {
    const [open, setOpen] = React.useState(level < 1)

    const handleOpenChange = (newState: boolean): void => {
      setOpen(newState)
    }

    const navigate = useNavigate()
    const handleNavigation = (link: string | undefined): void => {
      if (link) navigate(link)
    }

    const TreeItem = (): React.ReactNode => {
      return (
        <IGRPSidebarMenuButtonPrimitive
          onClick={(e) => {
            e.stopPropagation()
            handleNavigation(item.link)
            handleSubItemClick(e, item)
            handleOpenChange(!open)
          }}
          className="data-[active=true]:bg-transparent group/icon justify-between items-center align-middle"
          isActive={activeItem === item.label}
        >
          <div className="flex items-center space-x-2">
            {item.subItems && item.subItems.length > 0 && (
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            )}

            {item.icon && <item.icon className="h-4 w-4" />}

            {item.badgeName && (
              <span className={cn('text-orange-500', `${item.badgeColor}`)}>{item.badgeName}</span>
            )}
            <span>
              {item.label}
              {item.subItems &&
                item.subItems.length > 0 &&
                activeMenuGroup === 'APIs' &&
                `(${item.subItems.length})`}
            </span>
          </div>

          <div className="opacity-0 flex items-center group-hover/icon:opacity-100">
            <DropdownSidebarMenuButton menuItem={item} basePath={basePath} />
          </div>
        </IGRPSidebarMenuButtonPrimitive>
      )
    }

    if (!item.subItems?.length) {
      return <TreeItem key={item.id} />
    }

    return (
      <IGRPSidebarMenuItemPrimitive>
        <IGRPCollapsiblePrimitive
          className="group/collapsible"
          open={open}
          onOpenChange={handleOpenChange}
        >
          <IGRPCollapsibleTriggerPrimitive asChild>
            <TreeItem key={item.id} />
          </IGRPCollapsibleTriggerPrimitive>
          <IGRPCollapsibleContentPrimitive>
            <IGRPSidebarMenuSubPrimitive className="pr-0! mr-0!">
              {item.subItems?.map((subItem, index) => (
                <Three
                  key={index}
                  level={index}
                  item={subItem}
                  handleSubItemClick={handleSubItemClick}
                  activeItem={activeItem}
                  basePath={basePath}
                  activeMenuGroup={activeMenuGroup}
                />
              ))}
            </IGRPSidebarMenuSubPrimitive>
          </IGRPCollapsibleContentPrimitive>
        </IGRPCollapsiblePrimitive>
      </IGRPSidebarMenuItemPrimitive>
    )
  }
)
Three.displayName = 'Three'
