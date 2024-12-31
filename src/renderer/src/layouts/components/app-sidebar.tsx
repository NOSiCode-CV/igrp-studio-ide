import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar
} from '@renderer/components/ui/sidebar'
import { Badge, ChevronDown, FileText, Home, Server } from 'lucide-react'

import { cn } from '@renderer/lib/utils'
import { filterSubItems } from '@renderer/utils/helpers'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { ConfigOptions, MenuItem } from 'src/main/types'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { AppSidebarHeader } from './app-sidebar-header'
import { DropdownSidebarMenuButton } from './dropdown-sidebar-menu-button'
import { useNavigate } from 'react-router-dom'

interface AppSidebarProps {
  className?: string
  menuItems: MenuItem[]
  config?: ConfigOptions
  basePath?: string
  header?: boolean
}

export function AppSidebar({ className, menuItems, config, basePath, header }: AppSidebarProps) {
  const { t } = useTranslation()
  const { setOpen } = useSidebar()
  const { state: sidebarState } = useSidebar()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeItem, setActiveItem] = useState('')
  const filteredNavData = filterSubItems(menuItems, searchQuery)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleSubItemClick = (e: React.MouseEvent, subItem: MenuItem) => {
    e.preventDefault()
    if (subItem.click) {
      subItem.click(subItem)
    }
    setActiveItem(subItem.label)
  }

  const menuIcons: MenuItem[] = [
    { icon: Server, link: '/app', label: 'APIs', id: 'app' },
    { icon: FileText, link: '/documents', label: 'Documents' },
    { icon: Badge, link: '/settings', label: 'Settings' }
  ]
  return (
    <>
      <Sidebar
        collapsible="icon"
        className={cn('overflow-hidden [&>[data-sidebar=sidebar]]:flex-row mt-10', className)}
      >
        {/* First Sidebar */}
        <Sidebar
          collapsible="none"
          className={cn('!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r', '!w-20')}
        >
          <SidebarHeader className="pr-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  asChild
                  className="md:h-8 md:p-0 items-center justify-center"
                >
                  <a href="/">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-igrp text-sidebar-primary-foreground">
                      <Home className="size-4" />
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="px-1.5 md:px-0">
                <SidebarMenu>
                  {menuIcons.map((item, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton
                        tooltip={{ children: t(item.label), hidden: false }}
                        onClick={() => {
                          setOpen(true)
                        }}
                        className="px-2.5 md:px-2 flex flex-col h-auto rounded-lg"
                        isActive={item.id === 'app'}
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          {item.icon && <item.icon size={20} />}
                        </div>
                        <span className="text-xs text-center">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="items-center justify-center">
            <SidebarTrigger className="mb-14 items-center justify-center" />
          </SidebarFooter>
        </Sidebar>

        {/* Second Sidebar */}
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          {header && (
            <AppSidebarHeader
              config={config}
              basePath={basePath}
              sidebarState={sidebarState}
              handleSearch={handleSearch}
            />
          )}
          <SidebarContent className="mb-10">
            <ScrollArea>
              {filteredNavData.map((item: MenuItem, index: number) => (
                <React.Fragment key={index}>
                  <SidebarGroup>
                    <SidebarGroupContent key={index}>
                      <SidebarMenu>
                        <Collapsible defaultOpen className="group/collapsible">
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton className="w-full justify-between group/icon">
                                <div className="flex items-center space-x-2">
                                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180"  />
                                  {item.icon && <item.icon className="h-4 w-4" />}
                                  <span>{t(item.label)}</span>
                                </div>
                                <div className="flex items-center opacity-0 group-hover/icon:opacity-100">
                                  {item.dropdownMenus && (
                                    <DropdownSidebarMenuButton
                                      menuItem={item}
                                    />
                                  )}
                                </div>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="!pr-0 !mr-0">
                                {item.subItems?.map((menu, menuIndex) => {
                                  return (
                                    <SidebarGroupContentComp
                                      key={menuIndex}
                                      item={menu}
                                      handleSubItemClick={handleSubItemClick}
                                      activeItem={activeItem}
                                    />
                                  )
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </React.Fragment>
              ))}
            </ScrollArea>
          </SidebarContent>
        </Sidebar>
      </Sidebar>
    </>
  )
}
const SidebarGroupContentComp: React.FC<{
  item: MenuItem
  handleSubItemClick: (e: React.MouseEvent, subItem: MenuItem) => void
  activeItem: string
}> = ({ item, handleSubItemClick, activeItem }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const handleNavigation = (link) => {
    if (link) navigate(link)
  }
  return (
    <SidebarGroupContent>
      <SidebarMenu>
        <Collapsible defaultOpen className={cn(`group/collapsibleItem`)}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className="w-full justify-between group/icon"
                onClick={(e) => {
                  handleNavigation(item.link)
                  handleSubItemClick(e, item)
                }}
              >
                <div className="flex items-center space-x-2">
                  <ChevronDown
                    className={cn(
                      `h-4 w-4 transition-transform group-data-[state=open]/collapsibleItem:rotate-180`
                    )}
                  />

                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  <span>
                    {t(item.label)} {item.subItems && `(${item.subItems.length})`}
                  </span>
                </div>
                <div className="flex items-center opacity-0 group-hover/icon:opacity-100">
                  {item.dropdownMenus && (
                    <DropdownSidebarMenuButton menuItem={item} />
                  )}
                </div>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="!pr-0 !mr-0">
                {item.subItems?.map((subItem, subIndex) =>
                  subItem.subItems && subItem.subItems?.length > 0 ? (
                    // Renderizar recursivamente se subItems existir
                    <SidebarGroupContentComp
                      key={subIndex}
                      item={subItem}
                      handleSubItemClick={handleSubItemClick}
                      activeItem={activeItem}
                    />
                  ) : (
                    // Renderizar como item final
                    <SidebarMenuSubItem key={subIndex}>
                      <SidebarMenuSubButton
                        onClick={(e) => {
                          handleNavigation(subItem.link)
                          handleSubItemClick(e, subItem)
                        }}
                        className="cursor-pointer"
                        isActive={activeItem === subItem.label}
                      >
                        {subItem.badgeName && (
                          <span className={cn('text-orange-500', `${subItem.badgeColor}`)}>
                            {subItem.badgeName}
                          </span>
                        )}
                        {subItem.label}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroupContent>
  )
}
