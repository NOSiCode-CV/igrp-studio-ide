import { Button } from '@renderer/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { Ellipsis } from 'lucide-react';

interface DropdownItemProps {
    comp: StructuredComponent;
}

export function DropdownItem({ comp }: DropdownItemProps) {
    const { children } = comp;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={'ghost'} size={'icon'}>
                    <Ellipsis />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {children.length > 0 &&
                    children.map((child) => (
                        <DropdownMenuItem key={child.id}>
                            {child.label}
                        </DropdownMenuItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
