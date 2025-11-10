import * as React from 'react'
import { ChevronRight, LucideIcon } from 'lucide-react'

import {
  IGRPCollapsiblePrimitive,
  IGRPCollapsibleContentPrimitive,
  IGRPCollapsibleTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'

import {
  IGRPSidebarPrimitive,
  IGRPSidebarContentPrimitive,
  IGRPSidebarFooterPrimitive,
  IGRPSidebarGroupPrimitive,
  IGRPSidebarGroupContentPrimitive,
  IGRPSidebarGroupLabelPrimitive,
  IGRPSidebarHeaderPrimitive,
  IGRPSidebarMenuPrimitive,
  IGRPSidebarMenuButtonPrimitive,
  IGRPSidebarMenuItemPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPScrollAreaPrimitive } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import { SearchInput } from '../../components/shared-ui'
import { JSX } from 'react/jsx-runtime'

export interface SidebarItem {
  name: string // Title of the navigation item
  href: string // URL for the item
  isActive?: boolean // Optional property to mark if the item is active
  icon?: LucideIcon
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

export interface SidebarItemProps {
  name: string
  href?: string
  icon?: LucideIcon // URL for the section
  items?: SidebarItem[] // Array of sub-items in the section
  searchActive?: boolean
  type: 'collapsible' | 'group' | 'item'
}

export interface SidebarProps extends React.ComponentProps<typeof IGRPSidebarPrimitive> {
  children: React.ReactNode
  items?: SidebarProps[]
  collapsible?: 'offcanvas' | 'icon' | 'none'
}

export interface SidebarHeaderProps extends React.ComponentProps<'div'> {
  children?: React.ReactNode
}

export interface SidebarContentProps extends React.ComponentProps<'div'> {
  items: SidebarItemProps[]
  children?: React.ReactNode
  searchActive?: boolean
}

export interface SidebarFooterProps extends React.ComponentProps<'div'> {
  items: SidebarItemProps[]
  children?: React.ReactNode
}

const Sidebar = ({ collapsible = 'offcanvas', children, ...props }: SidebarProps) => {
  return (
    <IGRPSidebarPrimitive
      collapsible={collapsible}
      className={cn(props.className, 'group-data-[side=left]:border-r-none')}
      {...props}
    >
      {children}
    </IGRPSidebarPrimitive>
  )
}

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ items, searchActive = true, children, className, ...props }, ref) => {
    const [searchTerm, setSearchTerm] = React.useState('')

    const filteredItems = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <IGRPSidebarContentPrimitive ref={ref} {...props} className={cn('gap-0 py-3', className)}>
        <IGRPScrollAreaPrimitive className="h-[calc(100svh-var(--header-height-two))]">
          <div className="flex flex-col h-full px-3">
            {searchActive && (
              <div className="group-data-[collapsible=icon]:hidden">
                <SearchInput
                  value={searchTerm}
                  placeholder="Search"
                  onChange={(value) => setSearchTerm(value)}
                  className="lg:w-auto"
                />
              </div>
            )}

            {children}

            {renderMenu(filteredItems, null)}
          </div>
        </IGRPScrollAreaPrimitive>
      </IGRPSidebarContentPrimitive>
    )
  }
)

SidebarContent.displayName = 'SidebarContent'

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <IGRPSidebarHeaderPrimitive
        ref={ref}
        className={cn('p-2 flex items-center justify-center border-b border-border', className)}
        {...props}
      >
        {children}
      </IGRPSidebarHeaderPrimitive>
    )
  }
)

SidebarHeader.displayName = 'SidebarHeader'

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ items, children, className, ...props }, ref) => {
    return (
      <IGRPSidebarFooterPrimitive
        ref={ref}
        className={cn('px-3 py-2 border-t border-border', className)}
        {...props}
      >
        {children}
        {renderMenu(items, 'sm')}
      </IGRPSidebarFooterPrimitive>
    )
  }
)

SidebarFooter.displayName = 'SidebarFooter'

const renderMenu = (menus: SidebarItemProps[], size: 'lg' | 'sm' | null): JSX.Element => {
  return (
    <>
      {menus.map((item) =>
        item.type === 'item' ? (
          <IGRPSidebarMenuPrimitive key={item.name}>
            <IGRPSidebarMenuItemPrimitive>
              <IGRPSidebarMenuButtonPrimitive tooltip={item.name}>
                {item.icon && <item.icon />}
                <a href={item.href ?? '#'}>{item.name}</a>
              </IGRPSidebarMenuButtonPrimitive>
            </IGRPSidebarMenuItemPrimitive>
          </IGRPSidebarMenuPrimitive>
        ) : item.type === 'group' ? (
          <IGRPSidebarGroupPrimitive key={item.name} className="px-0">
            <IGRPSidebarGroupLabelPrimitive>{item.name}</IGRPSidebarGroupLabelPrimitive>
            {item.items && (
              <IGRPSidebarGroupContentPrimitive>
                <IGRPSidebarMenuPrimitive>
                  {item.items.map((subItem) => (
                    <IGRPSidebarMenuItemPrimitive key={subItem.name}>
                      <IGRPSidebarMenuButtonPrimitive
                        asChild
                        isActive={subItem.isActive}
                        onClick={(e) => {
                          e.preventDefault()
                          subItem.onClick?.(e)
                        }}
                      >
                        <a href={subItem.href ?? '#'}>{subItem.name}</a>
                      </IGRPSidebarMenuButtonPrimitive>
                    </IGRPSidebarMenuItemPrimitive>
                  ))}
                </IGRPSidebarMenuPrimitive>
              </IGRPSidebarGroupContentPrimitive>
            )}
          </IGRPSidebarGroupPrimitive>
        ) : (
          <IGRPCollapsiblePrimitive
            key={item.name}
            title={item.name}
            className="group/collapsible"
            asChild
          >
            <IGRPSidebarGroupPrimitive>
              <IGRPSidebarGroupLabelPrimitive
                asChild
                className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                {item.items ? (
                  <IGRPCollapsibleTriggerPrimitive asChild>
                    <IGRPSidebarMenuButtonPrimitive tooltip={item.name}>
                      {item.icon && <item.icon />}
                      <span>{item.name}</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </IGRPSidebarMenuButtonPrimitive>
                  </IGRPCollapsibleTriggerPrimitive>
                ) : (
                  <IGRPSidebarMenuButtonPrimitive tooltip={item.name} size={size} asChild>
                    <a href={item.href ?? '#'} className="flex flex-1">
                      {item.icon && <item.icon />}
                      <span>{item.name}</span>
                    </a>
                  </IGRPSidebarMenuButtonPrimitive>
                )}
              </IGRPSidebarGroupLabelPrimitive>
              {item.items && (
                <IGRPCollapsibleContentPrimitive>
                  <IGRPSidebarGroupContentPrimitive>
                    <IGRPSidebarMenuPrimitive>
                      {item.items.map((subItem) => (
                        <IGRPSidebarMenuItemPrimitive key={subItem.name}>
                          <IGRPSidebarMenuButtonPrimitive asChild isActive={subItem.isActive}>
                            <a href={subItem.href ?? '#'}>{subItem.name}</a>
                          </IGRPSidebarMenuButtonPrimitive>
                        </IGRPSidebarMenuItemPrimitive>
                      ))}
                    </IGRPSidebarMenuPrimitive>
                  </IGRPSidebarGroupContentPrimitive>
                </IGRPCollapsibleContentPrimitive>
              )}
            </IGRPSidebarGroupPrimitive>
          </IGRPCollapsiblePrimitive>
        )
      )}
    </>
  )
}
export { Sidebar, SidebarContent, SidebarHeader, SidebarFooter }
