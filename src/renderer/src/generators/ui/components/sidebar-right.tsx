import * as React from 'react';
import { Plus, X } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@renderer/components/ui/sidebar';
import { Button } from '@renderer/components/ui/button';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';

export function SidebarRight({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    const { clearEditingComponent } = useDroppedComponents();

    const handleClose = () => {
        clearEditingComponent();
    };

    return (
        <Sidebar
            collapsible="none"
            className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row !top-[--header-height-two] !h-[calc(100svh-var(--header-height-two))]"
            {...props}
        >
            <SidebarHeader className="h-16 border-b border-sidebar-border">
                <p className="items-center justify-between flex flex-1">
                    <span className="text-muted-foreground">Settings</span>
                    <Button variant={'ghost'} onClick={handleClose}>
                        <X />
                    </Button>
                </p>
            </SidebarHeader>
            <SidebarContent></SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <Plus />
                            <span>New Calendar</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
