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
} from '@renderer/components/ui/sidebar';
import { cn } from '@renderer/lib/utils';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { filterSubItems } from '@renderer/utils/helpers';
import React, { useEffect, useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import DraggableElement from '@renderer/generators/ui/dnd/DraggableElement';

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
    data: Array<any>;
};

export function AppSidebar({ data: initialData, ...props }: AppSidebarProps) {
    const { setOpen } = useSidebar();
    const { t } = useTranslation();

    const [originalData, _setOriginalData] = useState(initialData);
    const [filteredData, setFilteredData] = useState(initialData);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeItem, setActiveItem] = useState(initialData[0] || {});

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredData(originalData);
        } else {
            setFilteredData(filterSubItems(originalData, searchQuery));
        }
    }, [searchQuery, originalData]);

    useEffect(() => {
        setActiveItem(filteredData[0] || {});
    }, [filteredData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <Sidebar
            collapsible="icon"
            className={cn(
                'overflow-hidden [&>[data-sidebar=sidebar]]:flex-row mt-20',
                props.className
            )}
            {...props}
        >
            {/* First Sidebar */}
            <Sidebar
                collapsible="none"
                className={cn(
                    '!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r',
                    '!w-20'
                )}
            >
                <SidebarHeader className="pr-0">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                asChild
                                className="md:h-8 md:p-0 items-center justify-center"
                            >
                                <a href="#/">
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
                                {filteredData.map((item) => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            tooltip={{
                                                children: t(item.label),
                                                hidden: false,
                                            }}
                                            onClick={(e) => {
                                                setActiveItem(item);
                                                item.click(e);
                                                setOpen(true);
                                            }}
                                            isActive={
                                                activeItem?.id === item.id
                                            }
                                            size="lg"
                                            className="px-2.5 md:px-2 flex flex-col h-auto rounded-lg"
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center">
                                                <item.icon size={20} />
                                            </div>
                                            <span className="text-xs text-center sr-only">
                                                {t(item.label)}
                                            </span>
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
                            <Droppable
                                droppableId={`${activeItem.id}`}
                                key={activeItem.id}
                                isDropDisabled={true}
                                type={activeItem.type}
                            >
                                {(provided) => (
                                    <div
                                        className="grid grid-cols-2 gap-3 p-3 rounded-lg"
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        {activeItem?.subItems &&
                                            activeItem.subItems.map(
                                                (subItem, key) => (
                                                    <div
                                                        key={subItem.id}
                                                        className="flex flex-col items-center justify-center bg-white rounded-md shadow-sm"
                                                        onClick={() => {
                                                            if (
                                                                typeof subItem.click ===
                                                                'function'
                                                            ) {
                                                                subItem.click(
                                                                    subItem
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <DraggableElement
                                                            item={subItem}
                                                            index={key}
                                                        />
                                                    </div>
                                                )
                                            )}

                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </Sidebar>
    );
}
