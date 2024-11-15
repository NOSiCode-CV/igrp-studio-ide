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
} from "@renderer/components/ui/sidebar";
import { cn } from "@renderer/lib/utils";
import { Command, GripHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { filterSubItems } from "@renderer/utils/helpers";
import { useEffect, useState } from "react";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
    data: Array<any>; // Define the appropriate type for your data
};

export function AppSidebar({ data: initialData, ...props }: AppSidebarProps) {
    const { setOpen } = useSidebar();
    const { t } = useTranslation();

    // Preserve the original data separately
    const [originalData, _setOriginalData] = useState(initialData);
    const [filteredData, setFilteredData] = useState(initialData);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeItem, setActiveItem] = useState(initialData[0] || {});

    // Update filtered data whenever the search query or original data changes
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredData(originalData);
        } else {
            setFilteredData(filterSubItems(originalData, searchQuery));
        }
    }, [searchQuery, originalData]);

    // Ensure the active item stays in sync with filtered data
    useEffect(() => {
        setActiveItem(filteredData[0] || {});
    }, [filteredData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <Sidebar
            collapsible="icon"
            className={cn("overflow-hidden [&>[data-sidebar=sidebar]]:flex-row mt-20", props.className)}
            {...props}
        >
            {/* First Sidebar */}
            <Sidebar collapsible="none" className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r">
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
                                {filteredData.map((item) => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            tooltip={{ children: t(item.label), hidden: false }}
                                            onClick={(e) => {
                                                setActiveItem(item);
                                                item.click(e);
                                                setOpen(true);
                                            }}
                                            isActive={activeItem?.id === item.id}
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
                    <SidebarTrigger className="mb-20" />
                </SidebarFooter>
            </Sidebar>

            {/* Second Sidebar */}
            <Sidebar collapsible="none" className="hidden flex-1 md:flex">
                <SidebarHeader className="gap-3.5 border-b p-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-base font-medium text-foreground">
                            {t(activeItem?.label)}
                        </div>
                    </div>
                    <SidebarInput
                        placeholder="Type to search..."
                        value={searchQuery}
                        onChange={handleInputChange}
                    />
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup className="px-0">
                        <SidebarGroupContent>
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg">
                                {activeItem?.subItems &&
                                    activeItem.subItems.map((subItem) => (
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
    );
}
