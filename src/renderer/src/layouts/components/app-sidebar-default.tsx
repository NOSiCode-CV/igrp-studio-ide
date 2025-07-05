import * as React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@renderer/components/ui/collapsible';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@renderer/components/ui/sidebar';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { cn } from '@renderer/lib/utils';
import { SearchInput } from '../../components/shared-ui';

export interface SidebarItem {
    name: string; // Title of the navigation item
    href: string; // URL for the item
    isActive?: boolean; // Optional property to mark if the item is active
    icon?: LucideIcon;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export interface SidebarProps {
    name: string;
    href?: string;
    icon?: LucideIcon; // URL for the section
    items?: SidebarItem[]; // Array of sub-items in the section
    searchActive?: boolean;
    type: 'collapsible' | 'group' | 'item';
}

export interface IGRPSidebarProps extends React.ComponentProps<typeof Sidebar> {
    children: React.ReactNode;
    items?: SidebarProps[];
    collapsible?: 'offcanvas' | 'icon' | 'none';
}

export interface IGRPSidebarHeaderProps extends React.ComponentProps<'div'> {
    children?: React.ReactNode;
}

export interface IGRPSidebarContentProps extends React.ComponentProps<'div'> {
    items: SidebarProps[];
    children?: React.ReactNode;
    searchActive?: boolean;
}

export interface IGRPSidebarFooterProps extends React.ComponentProps<'div'> {
    items: SidebarProps[];
    children?: React.ReactNode;
}

const IGRPSidebar = ({
    collapsible = 'offcanvas',
    children,
    ...props
}: IGRPSidebarProps) => {
    return (
        <Sidebar
            collapsible={collapsible}
            className={cn(
                props.className,
                'group-data-[side=left]:border-r-none'
            )}
            {...props}
        >
            {children}
        </Sidebar>
    );
};

const IGRPSidebarContent = React.forwardRef<
    HTMLDivElement,
    IGRPSidebarContentProps
>(({ items, searchActive = true, children, className, ...props }, ref) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <SidebarContent
            ref={ref}
            {...props}
            className={cn('gap-0 py-3', className)}
        >
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
        </SidebarContent>
    );
});

IGRPSidebarContent.displayName = 'IGRPSidebarContent';

const IGRPSidebarHeader = React.forwardRef<
    HTMLDivElement,
    IGRPSidebarHeaderProps
>(({ className, children, ...props }, ref) => {
    return (
        <SidebarHeader
            ref={ref}
            className={cn(
                'p-2 flex items-center justify-center border-b border-border',
                className
            )}
            {...props}
        >
            {children}
        </SidebarHeader>
    );
});

IGRPSidebarHeader.displayName = 'IGRPSidebarHeader';

const IGRPSidebarFooter = React.forwardRef<
    HTMLDivElement,
    IGRPSidebarFooterProps
>(({ items, children, className, ...props }, ref) => {
    return (
        <SidebarFooter
            ref={ref}
            className={cn('px-3 py-2 border-t border-border', className)}
            {...props}
        >
            {children}
            {renderMenu(items, 'sm')}
        </SidebarFooter>
    );
});

IGRPSidebarFooter.displayName = 'IGRPSidebarFooter';

const renderMenu = (menus: SidebarProps[], size: 'lg' | 'sm' | null) => {
    return (
        <>
            {menus.map((item) =>
                item.type === 'item' ? (
                    <SidebarMenu key={item.name}>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip={item.name}>
                                {item.icon && <item.icon />}
                                <a href={item.href ?? '#'}>{item.name}</a>
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
                                                    e.preventDefault();
                                                    subItem.onClick?.(e);
                                                }}
                                            >
                                                <a href={subItem.href ?? '#'}>
                                                    {subItem.name}
                                                </a>
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
                                    <SidebarMenuButton
                                        tooltip={item.name}
                                        size={size}
                                        asChild
                                    >
                                        <a
                                            href={item.href ?? '#'}
                                            className="flex flex-1"
                                        >
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
                                                <SidebarMenuItem
                                                    key={subItem.name}
                                                >
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={
                                                            subItem.isActive
                                                        }
                                                    >
                                                        <a
                                                            href={
                                                                subItem.href ??
                                                                '#'
                                                            }
                                                        >
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
    );
};
export {
    IGRPSidebar,
    IGRPSidebarContent,
    IGRPSidebarHeader,
    IGRPSidebarFooter,
};
