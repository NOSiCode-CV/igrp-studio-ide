import React from 'react';
import { Plus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Button } from '@renderer/components/ui/button';
import { MenuItem } from 'src/main/types';

interface DropdownSidebarMenuButtonProps {
    menuItem: MenuItem;
}

export const DropdownSidebarMenuButton: React.FC<
    DropdownSidebarMenuButtonProps
> = ({ menuItem }) => {
    const handleDropdownClick = (item: MenuItem) => {
        if (item.dropdownclick) {
            item.dropdownclick(item);
        }
    };
    if (!menuItem.dropdownMenus?.length) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={'ghost'} size={'icon'}>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="right"
                align="start"
                className="min-w-56 rounded-lg"
            >
                {menuItem.dropdownMenus.map((menu, idx) => (
                    <DropdownMenuItem
                        key={idx}
                        onClick={() =>
                            handleDropdownClick({
                                ...menu,
                                ...menuItem,
                                type: menu.type,
                                label: menu.label,
                                isNew: true,
                            })
                        }
                    >
                        {menu.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
