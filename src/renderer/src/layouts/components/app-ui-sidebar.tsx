"use client"

import * as React from "react"
import { ArchiveX, Command, File, Inbox, Send, Trash2 } from "lucide-react"

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

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
    data: Array<any> // or any other type for your new parameter
};


export function AppSidebar({ ...props }: AppSidebarProps) {

    const data = props.data;

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
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            tooltip={{
                                                children: item.title,
                                                hidden: false,
                                            }}
                                          /*   onClick={() => {
                                                setActiveItem(item)
                                                const mail = data.mails.sort(() => Math.random() - 0.5)
                                                setMails(
                                                    mail.slice(
                                                        0,
                                                        Math.max(5, Math.floor(Math.random() * 10) + 1)
                                                    )
                                                )
                                                setOpen(true)
                                            }} */
                                            isActive={activeItem.title === item.title}
                                            className="px-2.5 md:px-2"
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    {/* <NavUser user={data.user} /> */}
                    <SidebarTrigger />
                </SidebarFooter>
            </Sidebar>

            {/* This is the second sidebar */}
            {/* We disable collapsible and let it fill remaining space */}
            <Sidebar collapsible="none" className="hidden flex-1 md:flex">
                <SidebarHeader className="gap-3.5 border-b p-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-base font-medium text-foreground">
                            {activeItem.title}
                        </div>
                    </div>
                    <SidebarInput placeholder="Type to search..." />
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup className="px-0">
                        <SidebarGroupContent>
                            {/* {mails.map((mail) => (
                                <a
                                    href="#"
                                    key={mail.email}
                                    className="flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                >
                                    <div className="flex w-full items-center gap-2">
                                        <span>{mail.name}</span>{" "}
                                        <span className="ml-auto text-xs">{mail.date}</span>
                                    </div>
                                    <span className="font-medium">{mail.subject}</span>
                                    <span className="line-clamp-2 w-[260px] whitespace-break-spaces text-xs">
                                        {mail.teaser}
                                    </span>
                                </a>
                            ))} */}
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </Sidebar>
    )
}
