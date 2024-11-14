"use client"

import * as React from "react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarInput,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "@renderer/components/ui/sidebar"
import { cn } from "@renderer/lib/utils"
import { ChevronDown, Command, GripHorizontal, GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@renderer/components/ui/dropdown-menu";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
    data: Array<any> // or any other type for your new parameter
};


export function AppSidebar({ ...props }: AppSidebarProps) {

    const data = props.data;

    const { t } = useTranslation()

    // Note: I'm using state to show active item.
    // IRL you should use the url/router.
    const [activeItem, setActiveItem] = React.useState(data[0])
    // const [mails, setMails] = React.useState(data.mails)
    const { setOpen } = useSidebar()


    return (
        <Sidebar
            collapsible="icon"
            className={cn("overflow-hidden [&>[data-sidebar=sidebar]]:flex-row mt-20", props.className)}
            {...props}
        >
            {/* This is the first sidebar */}
            {/* We disable collapsible and adjust width to icon. */}
            {/* This will make the sidebar appear as icons. */}
            <Sidebar
                collapsible="none"
                className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
            >
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                                <a href="#">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                        <Command className="size-4" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">Acme Inc</span>
                                        <span className="truncate text-xs">Enterprise</span>
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
                                {data.map((item) => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            tooltip={{
                                                children: t(item.label),
                                                hidden: false,
                                            }}
                                            onClick={(e) => {
                                                setActiveItem(item)
                                                item.click(e)
                                                setOpen(true)
                                            }}
                                            isActive={activeItem.id === item.id}
                                            className="px-2.5 md:px-2"
                                        >
                                            <item.icon className="h-4 w-4" />
                                            <span>{t(item.label)}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    {/* <NavUser user={data.user} /> */}
                    <SidebarTrigger className="mb-20"/>
                </SidebarFooter>
            </Sidebar>

            {/* This is the second sidebar */}
            {/* We disable collapsible and let it fill remaining space */}
            <Sidebar collapsible="none" className="hidden flex-1 md:flex">
                <SidebarHeader className="gap-3.5 border-b p-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-base font-medium text-foreground">
                            {t(activeItem.label)}
                        </div>
                    </div>
                    <SidebarInput placeholder="Type to search..." />
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup className="px-0">
                        <SidebarGroupContent>
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg">
                                {activeItem.subItems?.map((subItem) => (
                                    <div
                                        key={subItem.id}
                                        className="h-24 flex flex-col items-center justify-center bg-white rounded-md p-3 shadow-sm cursor-move space-y-2"
                                        onClick={() => subItem.click(subItem)}
                                    >
                                        <GripHorizontal className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        {subItem.icon && <subItem.icon className="h-5 w-5" />}
                                        <span className="text-sm text-center">{t(subItem.label)}</span>
                                    </div>
                                ))}
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </Sidebar>
    )
}
