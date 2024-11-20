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
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from "lucide-react"

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
import { CreateModuleDialog } from "@renderer/generators/api/components/create-module-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@renderer/components/ui/dropdown-menu";

interface AppSidebarProps {
    className?: string
    menuItems: MenuItem[]
    config?: ConfigOptions,
    basePath: string
}

export function AppSidebar({ className, menuItems, config, basePath }: AppSidebarProps) {
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

    const dropdownMenus = [
        {
            label: 'dto',
            type: "dto"
        },
        {
            label: 'models',
            type: "models"
        },
        {
            label: 'controllers',
            type: "controllers"
        }
    ]

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
                        <span className="truncate text-xs">{config?.projectStructureStyle}</span>
                    </div>
                    <CreateModuleDialog basePath={basePath} />
                </SidebarMenuButton>
                <FormSearch onSearch={handleSearch} className="truncate text-xs" placeholder="Search models, dto..." sidebarState={sidebarState} />
            </SidebarHeader>
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
                                            {dropdownMenus.map((opt, key) => (
                                                <DropdownMenuItem key={key}
                                                    onClick={() => openNewProject({ ...opt, module: item.label })}>{t(opt.label)}</DropdownMenuItem>
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
                                                                    {/*  <SidebarMenuAction className="mr-2">
                                                                        <Plus className="h-4 w-4" onClick={() => openNewProject(menu)} />
                                                                        <span className="sr-only">{t(`Add ${menu.label}`)}</span>
                                                                    </SidebarMenuAction> */}
                                                                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                                </div>
                                                            </SidebarMenuButton>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {menu.subItems?.map((subItem, subIndex) => (
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