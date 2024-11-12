import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@renderer/components/ui/sidebar"
import { ChevronDown, Plus } from "lucide-react"

import { cn } from "@renderer/lib/utils"
import { filterSubItems } from "@renderer/utils/helpers";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@renderer/components/ui/collapsible";
import { ConfigOptions, MenuItem } from "src/main/types";
import FormSearch from "../components/app-search";
import SpringIcon from '@renderer/assets/images/Spring30x30.svg'
import { useDispatch } from "react-redux";
import { setCurrentItem as onSetCurrentItem } from "@renderer/redux/thunks";
import { ScrollArea } from "@renderer/components/ui/scroll-area";

interface AppSidebarProps {
    className?: string
    menuItems: MenuItem[]
    config?: ConfigOptions,
}

export function AppSidebar({ className, menuItems, config }: AppSidebarProps) {
    const dispatch: any = useDispatch()
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeItem, setActiveItem] = useState("")
    const filteredNavData = filterSubItems(menuItems, searchQuery)
    const { state: sidebarState } = useSidebar()

    const setCurrentItem = (item) => {
        setActiveItem(item.id)
        dispatch(onSetCurrentItem(item))
    }

    const openNewProject = (item) => {
        dispatch(onSetCurrentItem(item))
    }

    const handleSearch = (value: string) => {
        setSearchQuery(value)
    }

    return (
        <Sidebar className={cn('flex flex-col', className)} collapsible="icon">
            <SidebarHeader>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ml-1"
                >
                    <div className="flex aspect-square items-center justify-center">
                        <img src={SpringIcon} className="" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold"> {config?.name}</span>
                        <span className="truncate text-xs">Api Generator UI</span>
                    </div>
                </SidebarMenuButton>
                <FormSearch onSearch={handleSearch} className="truncate text-xs" placeholder="Search models, dto..." sidebarState={sidebarState} />
            </SidebarHeader>
            <SidebarContent>
                <ScrollArea>
                    {filteredNavData.map((item, index) => (
                        <React.Fragment key={index}>
                            <SidebarGroup>
                                {item.isHeader ? (
                                    <SidebarGroupLabel>{t(item.label)}</SidebarGroupLabel>
                                ) : (
                                    <SidebarGroupContent>
                                        <SidebarMenu>
                                            <Collapsible defaultOpen className="group/collapsible">
                                                <SidebarMenuItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuButton className="w-full justify-between">
                                                            <div className="flex items-center">
                                                                <item.icon className="mr-2 h-4 w-4" />
                                                                <span>{t(item.label)}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <SidebarMenuAction className="mr-2">
                                                                    <Plus className="h-4 w-4" onClick={() => openNewProject(item)} />
                                                                    <span className="sr-only">{t(`Add ${item.label}`)}</span>
                                                                </SidebarMenuAction>
                                                                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                            </div>
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <SidebarMenuSub>
                                                            {item.subItems?.map((subItem, subIndex) => (
                                                                <SidebarMenuSubItem key={subIndex}>
                                                                    <SidebarMenuSubButton
                                                                        onClick={() => setCurrentItem(subItem)}
                                                                        className="cursor-pointer"
                                                                        isActive={activeItem === subItem.id}>
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
                                )}
                            </SidebarGroup>
                        </React.Fragment>
                    ))}
                </ScrollArea>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}