'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@renderer/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';

import { cn } from '@renderer/lib/utils';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';
import { ScrollArea } from '../ui/scroll-area';

type IGRPComboboxProps = {
    options: IGRPOptionsProps[] | undefined;
    value?: string;
    onChange: (selected: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
};

// TODO: Check the props

function IGRPCombobox({
    options,
    value,
    onChange,
    placeholder = 'Select items...',
    className,
    disabled = false,
}: IGRPComboboxProps) {
    const [open, setOpen] = useState(false);

    // const floatingLabelClass = floatingLabel
    //   ? 'group relative'
    //   : '';

    const floatingLabelClass = '';

    const handleSelect = (currentValue: string) => {
        onChange(currentValue === value ? '' : currentValue);
        setOpen(false);
    };

    const setSelectValue = () => {
        return (
            <>
                {value ? (
                    <span
                        className={cn(
                            options?.find((opt) => opt.value === value)?.color
                        )}
                    >
                        {options?.find((opt) => opt.value === value)?.label}
                    </span>
                ) : (
                    placeholder
                )}
            </>
        );
    };

    return (
        <div className={cn('*:not-first:mt-2', floatingLabelClass)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            'w-full justify-between',
                            className,
                            disabled &&
                                'cursor-not-allowed pointer-events-none opacity-50'
                        )}
                    >
                        {setSelectValue()}
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50"' />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 min-w-50">
                    <ScrollArea>
                        <div className="max-h-[60svh]">
                            <Command>
                                <CommandInput
                                    placeholder={placeholder}
                                    className="h-8"
                                />
                                <CommandList>
                                    <CommandEmpty>No Item found.</CommandEmpty>
                                    <CommandGroup>
                                        {options &&
                                            options.map((opt) => (
                                                <CommandItem
                                                    key={opt.value}
                                                    value={opt.value.toString()}
                                                    onSelect={(currentValue) =>
                                                        handleSelect(
                                                            currentValue
                                                        )
                                                    }
                                                >
                                                    <span className={opt.color}>
                                                        {opt.label}
                                                    </span>
                                                    <Check
                                                        className={cn(
                                                            'ml-auto w-4 h-4',
                                                            value === opt.value
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export { IGRPCombobox };
export type { IGRPComboboxProps };
