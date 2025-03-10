import React from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@renderer/components/ui/dropdown-menu';
import { SchemaTypeItem } from 'src/main/types';
import { cn } from '@renderer/lib/utils';

interface TypeSelectorDropdownProps {
    type: string;
    onTypeChange: (type: string) => void;
    schemaTypes?: SchemaTypeItem[];
    className?: string;
    variant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link'
        | null
        | undefined;
    children?: React.ReactNode;
}

export const TypeSelectorDropdown: React.FC<TypeSelectorDropdownProps> = ({
    type,
    onTypeChange,
    schemaTypes,
    className,
    variant = 'ghost',
    children,
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    className={cn('h-6 px-2 text-sm', className)}
                >
                    <span className='flex flex-1'>{type || 'Set Type'}</span> {children}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
                {schemaTypes &&
                    schemaTypes.map(({ label, value, items }) => (
                        <React.Fragment key={value}>
                            {items && items.length > 0 ? (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        {label}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {items.map((subItem) => (
                                            <DropdownMenuItem
                                                key={subItem.value}
                                                onClick={() =>
                                                    onTypeChange({
                                                        type: value,
                                                        value: subItem.value,
                                                    } as any)
                                                }
                                            >
                                                {subItem.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() =>
                                        onTypeChange(value as string)
                                    }
                                >
                                    {label}
                                </DropdownMenuItem>
                            )}
                        </React.Fragment>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
