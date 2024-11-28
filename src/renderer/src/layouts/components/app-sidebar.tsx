import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@renderer/components/ui/sidebar"
import { ChevronDown, MoreHorizontal } from "lucide-react"

import { cn } from "@renderer/lib/utils"
import { filterSubItems } from "@renderer/utils/helpers";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@renderer/components/ui/collapsible";
import { ConfigOptions, MenuItem } from "src/main/types";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@renderer/components/ui/dropdown-menu";
import { AppSidebarHeader } from "./app-sidebar-header";

interface AppSidebarProps {
    className?: string
    menuItems: MenuItem[]
    config?: ConfigOptions,
    basePath?: string
    header?: boolean
}

export function AppSidebar({ className, menuItems, config, basePath , header}: AppSidebarProps) {
   
    const { t } = useTranslation()
    const { state: sidebarState } = useSidebar()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeItem, setActiveItem] = useState("")
    const filteredNavData = filterSubItems(menuItems, searchQuery)
   

    const setCurrentItem = (item) => {
        setActiveItem(item.label)
    }

    const handleSearch = (value: string) => {
        setSearchQuery(value)
    }

    const handleSubItemClick = (e: React.MouseEvent, subItem: MenuItem) => {
        e.preventDefault
        if (subItem.click) {
            subItem.click(subItem);
        }
        setCurrentItem(subItem);
    };

    const handleDropdownClick = (item: MenuItem) => {
        if (item.dropdownclick) {
            item.dropdownclick(item);
        }
    };

    return (
        <Sidebar className={cn('flex flex-col', className)} collapsible="icon">
           {header && 
                <AppSidebarHeader
                    config={config}
                    basePath={basePath}
                    sidebarState={sidebarState}
                    handleSearch={handleSearch}
                />
            }
            <SidebarContent>
                <ScrollArea>
                    {filteredNavData.map((item, index) => (
                        <React.Fragment key={index}>
                            <SidebarGroup>

                                {item.isHeader && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <SidebarGroupLabel className="flex items-center justify-between cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                                                <span>{item.label}</span>
                                                <div className="ml-2 flex items-center">
                                                    <MoreHorizontal className="h-4 w-4 text-gray-500 ml-auto" />
                                                </div>
                                            </SidebarGroupLabel>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            side={"right"}
                                            align={"start"}
                                            className="min-w-56 rounded-lg"
                                        >
                                            {item.dropdownMenus && 
                                            item.dropdownMenus.map((opt, key) => (
                                                <DropdownMenuItem key={key}
                                                    onClick={() => handleDropdownClick({module: item.label, ...opt, ...item} )}>{t(opt.label)}</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}

                                {item.subItems?.map((menu, menuIndex) => {

                                    return (
                                        <SidebarGroupContent key={menuIndex}>
                                            <SidebarMenu>
                                                <Collapsible defaultOpen className="group/collapsible">
                                                    <SidebarMenuItem>
                                                        <CollapsibleTrigger asChild>
                                                            <SidebarMenuButton className="w-full justify-between">
                                                                <div className="flex items-center">
                                                                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                                                    <span>{t(menu.label)}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                                </div>
                                                            </SidebarMenuButton>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {menu.subItems?.map((subItem, subIndex) => (
                                                                    <SidebarMenuSubItem key={subIndex}>
                                                                        <SidebarMenuSubButton
                                                                            onClick={(e) => handleSubItemClick(e, subItem)}
                                                                            className="cursor-pointer"
                                                                            isActive={activeItem === subItem.label}>
                                                                            {subItem.label}
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                ))}
                                                            </SidebarMenuSub>
                                                        </CollapsibleContent>
                                                    </SidebarMenuItem>
                                                </Collapsible>
                                            </SidebarMenu>
                                        </SidebarGroupContent>
                                    )
                                })}
                            </SidebarGroup>
                        </React.Fragment>
                    ))}
                </ScrollArea>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}