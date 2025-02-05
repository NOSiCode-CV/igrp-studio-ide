import React from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@renderer/components/ui/popover';

interface TypeSelectorPopoverProps {
    type: string;
    onTypeChange: (type: string) => void;
    schemaTypes?: { label: string; value: string }[];
}

export const TypeSelectorPopover: React.FC<TypeSelectorPopoverProps> = ({
    type,
    onTypeChange,
    schemaTypes,
}) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="h-6 px-2 text-sm">
                    {type}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
                <div className="flex flex-col">
                    {schemaTypes &&
                        schemaTypes.map(({ label, value }) => (
                            <Button
                                key={value}
                                variant={value === type ? 'secondary' : 'ghost'}
                                className="justify-start h-8 px-2 text-sm rounded-none"
                                onClick={() => onTypeChange(value as string)}
                            >
                                {label}
                            </Button>
                        ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};
