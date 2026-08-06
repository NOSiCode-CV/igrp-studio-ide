import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
// Aliased shadcn primitives — the file re-exports its own opinionated
// `Sidebar`, `SidebarContent`, `SidebarHeader` and `SidebarFooter` wrappers
// below, so we need the raw primitives under a different name.
import {
    Sidebar as ShadcnSidebar,
    SidebarContent as ShadcnSidebarContent,
    SidebarFooter as ShadcnSidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader as ShadcnSidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@renderer/components/ui/sidebar'
import { cn } from '@renderer/lib/utils'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import * as React from 'react'
import type { JSX } from 'react/jsx-runtime'
import { SearchInput } from '../../components/shared-ui'

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
    onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement, MouseEvent>) => void
}

export interface SidebarProps extends React.ComponentProps<typeof ShadcnSidebar> {
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
        <ShadcnSidebar
            collapsible={collapsible}
            className={cn(props.className, 'group-data-[side=left]:border-r-none')}
            {...props}
        >
            {children}
        </ShadcnSidebar>
    )
}

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
    ({ items, searchActive = true, children, className, ...props }, ref) => {
        const [searchTerm, setSearchTerm] = React.useState('')

        const filteredItems = items.filter((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )

        return (
            <ShadcnSidebarContent ref={ref} {...props} className={cn('gap-0 py-3', className)}>
                <ScrollArea className="h-[calc(100svh-var(--header-height-two))]">
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
                </ScrollArea>
            </ShadcnSidebarContent>
        )
    }
)

SidebarContent.displayName = 'SidebarContent'

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <ShadcnSidebarHeader
                ref={ref}
                className={cn(
                    'p-2 flex items-center justify-center border-b border-border',
                    className
                )}
                {...props}
            >
                {children}
            </ShadcnSidebarHeader>
        )
    }
)

SidebarHeader.displayName = 'SidebarHeader'

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
    ({ items, children, className, ...props }, ref) => {
        return (
            <ShadcnSidebarFooter
                ref={ref}
                className={cn('px-3 py-2 border-t border-border', className)}
                {...props}
            >
                {children}
                {renderMenu(items, 'sm')}
            </ShadcnSidebarFooter>
        )
    }
)

SidebarFooter.displayName = 'SidebarFooter'

const renderMenu = (menus: SidebarItemProps[], size: 'lg' | 'sm' | null): JSX.Element => {
    return (
        <>
            {menus.map((item) =>
                item.type === 'item' ? (
                    <SidebarMenu key={item.name}>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip={item.name}>
                                {item.icon && <item.icon />}
                                <a
                                    href={item.href ?? '#'}
                                    onClick={(e) => {
                                        if (item.onClick) {
                                            e.preventDefault()
                                            item.onClick(e)
                                        }
                                    }}
                                >
                                    {item.name}
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                ) : item.type === 'group' ? (
                    <SidebarGroup key={item.name} className="px-0">
                        <SidebarGroupLabel>{item.name}</SidebarGroupLabel>
                        {item.items && (
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {item.items.map((subItem) => (
                                        <SidebarMenuItem key={subItem.name}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={subItem.isActive}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    subItem.onClick?.(e)
                                                }}
                                            >
                                                <a href={subItem.href ?? '#'}>{subItem.name}</a>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>
                ) : (
                    <Collapsible
                        key={item.name}
                        title={item.name}
                        className="group/collapsible"
                        asChild
                    >
                        <SidebarGroup>
                            <SidebarGroupLabel
                                asChild
                                className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            >
                                {item.items ? (
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip={item.name}>
                                            {item.icon && <item.icon />}
                                            <span>{item.name}</span>
                                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                ) : (
                                    <SidebarMenuButton tooltip={item.name} size={size} asChild>
                                        <a href={item.href ?? '#'} className="flex flex-1">
                                            {item.icon && <item.icon />}
                                            <span>{item.name}</span>
                                        </a>
                                    </SidebarMenuButton>
                                )}
                            </SidebarGroupLabel>
                            {item.items && (
                                <CollapsibleContent>
                                    <SidebarGroupContent>
                                        <SidebarMenu>
                                            {item.items.map((subItem) => (
                                                <SidebarMenuItem key={subItem.name}>
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={subItem.isActive}
                                                    >
                                                        <a href={subItem.href ?? '#'}>
                                                            {subItem.name}
                                                        </a>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            ))}
                                        </SidebarMenu>
                                    </SidebarGroupContent>
                                </CollapsibleContent>
                            )}
                        </SidebarGroup>
                    </Collapsible>
                )
            )}
        </>
    )
}
export { Sidebar, SidebarContent, SidebarHeader, SidebarFooter }
