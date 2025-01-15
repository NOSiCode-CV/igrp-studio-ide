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
import { SchemaType } from '@igrp/spring-engine/dist/interfaces/types';
import { SchemaTypeItem } from 'src/main/types';

interface TypeSelectorDropdownProps {
    type: SchemaType;
    onTypeChange: (type: SchemaType) => void;
    schemaTypes?: SchemaTypeItem[];
}

export const TypeSelectorDropdown: React.FC<TypeSelectorDropdownProps> = ({
    type,
    onTypeChange,
    schemaTypes,
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 px-2 text-sm">
                    {type}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
                {schemaTypes &&
                    schemaTypes.map(({ label, value, items }) => (
                        <React.Fragment key={value}>
                            {items ? (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        {label}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {items.map((subItem) => (
                                            <DropdownMenuItem
                                                key={subItem.value}
                                                onClick={() =>
                                                    onTypeChange(subItem.value as SchemaType)
                                                }
                                            >
                                                {subItem.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => onTypeChange(value as SchemaType)}
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