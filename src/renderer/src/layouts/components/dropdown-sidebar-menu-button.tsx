import React from 'react';
import { Plus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
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
                <div className='text-muted-foreground hover:text-foreground'>
                    <Plus className='h-4 w-4'/>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="right"
                align="start"
                className="min-w-56 rounded-lg"
            >
                {menuItem.dropdownMenus.map((menu, idx) => (
                    <DropdownMenuItem
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDropdownClick({
                                ...menu,
                                ...menuItem,
                                type: menu.type,
                                label: menu.label,
                                isNew: true,
                            });
                        }}
                    >
                        {menu.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
