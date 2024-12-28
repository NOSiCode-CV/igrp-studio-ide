import React from 'react'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Button } from '@renderer/components/ui/button'
import { MenuItem } from 'src/main/types'

interface DropdownSidebarMenuButtonProps {
  dropdownMenus?: { label: string; action: () => void }[]
  menuItem: MenuItem
}

export const DropdownSidebarMenuButton: React.FC<DropdownSidebarMenuButtonProps> = ({
  dropdownMenus = [],
  menuItem
}) => {
  const handleDropdownClick = (item) => {
    if (item.dropdownclick) {
      item.dropdownclick(item)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={'ghost'} size={'icon'}>
          <MoreHorizontal className="h-4 w-4 " />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="min-w-56 rounded-lg">
        {dropdownMenus.map((menu, idx) => (
          <DropdownMenuItem
            key={idx}
            onClick={() => handleDropdownClick({ module: menuItem.label, ...menu, ...menuItem })}
          >
            {menu.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
