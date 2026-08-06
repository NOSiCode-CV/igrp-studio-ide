import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { Ellipsis } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface DropdownItemProps {
    comp: StructuredComponent
}

export function DropDownItem({ comp }: DropdownItemProps) {
    const { children } = comp
    const { t } = useTranslation()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={'ghost'} size={'icon'}>
                    <Ellipsis />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                {children.length > 0 &&
                    children.map((child) => (
                        <DropdownMenuItem key={child.id}>{child.label}</DropdownMenuItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
