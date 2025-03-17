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
    const renderIcon = (item: SchemaTypeItem) => {
        const { module } = item;
        if (module) {
            return (
                <div className="flex items-center justify-center w-5 h-5 rounded bg-igrp/25 text-igrp">
                    {module === 'shared' ? 'C' : module.charAt(0).toUpperCase()}
                </div>
            );
        }
        return null;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    className={cn('h-6 px-2 text-sm', className)}
                >
                    <span className="flex flex-1">{type || 'Set Type'}</span>{' '}
                    {children}
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
                                    <DropdownMenuSubContent className="min-w-40">
                                        {items.map((subItem, key) => (
                                            <DropdownMenuItem
                                                key={key}
                                                onClick={() =>
                                                    onTypeChange({
                                                        type: value,
                                                        value: subItem.value,
                                                        module: subItem.module,
                                                    } as any)
                                                }
                                            >
                                                {renderIcon(subItem)}
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
