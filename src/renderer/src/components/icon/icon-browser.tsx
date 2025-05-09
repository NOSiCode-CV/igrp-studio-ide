import { useMemo, useRef, useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

import { icons } from 'lucide-react';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../ui/command';
import { getLabel } from '@renderer/utils/helpers';
import { IGRPIconProps } from '@igrp/igrp-framework-react-design-system/dist/components/igrp/icon';

interface IconBrowserProps {
    selectedIcon: string;
    onSelectedIcon: (icon: string) => void;
}

const IconBrowser = ({ selectedIcon, onSelectedIcon }: IconBrowserProps) => {
    const [open, setOpen] = useState(false);

    const commandRef = useRef<HTMLDivElement>(null);

    const iconsList = useMemo(
        () => Object.keys(icons) as (keyof typeof icons)[],
        []
    );

    const handleIconClick = (iconName: string) => {
        onSelectedIcon(iconName);
        setOpen(false);
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="relative" ref={commandRef}>
                    <Command className="rounded-lg border shadow-md">
                        <CommandInput
                            placeholder="Type to search icon ..."
                            onFocus={() => setOpen(true)}
                            className="h-9"
                        />
                        {open && (
                            <CommandList className="max-h-[200px] overflow-auto">
                                <CommandEmpty>No icons found.</CommandEmpty>
                                <CommandGroup>
                                    <div className="grid grid-cols-[repeat(auto-fill,_minmax(30px,_1fr))] gap-4 w-full">
                                        {iconsList.map((iconName, index) => {
                                            const IconComponent =
                                                icons[iconName];
                                            return (
                                                <CommandItem
                                                    key={index}
                                                    onSelect={() =>
                                                        handleIconClick(
                                                            iconName
                                                        )
                                                    }
                                                    className="flex items-center justify-between p-2 cursor-pointer"
                                                    aria-label={`View details for ${iconName}`}
                                                    aria-describedby={`View details for-${iconName}`}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <>
                                                                <IconComponent
                                                                    name={
                                                                        iconName
                                                                    }
                                                                    className="h-6 w-6"
                                                                    aria-describedby={`tooltip-${iconName}`}
                                                                />
                                                                <span className="sr-only">
                                                                    {iconName}
                                                                </span>
                                                            </>
                                                        </TooltipTrigger>
                                                        {!selectedIcon && (
                                                            <TooltipContent>
                                                                {getLabel(
                                                                    iconName
                                                                )}
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                </CommandItem>
                                            );
                                        })}
                                    </div>
                                </CommandGroup>
                            </CommandList>
                        )}
                    </Command>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default IconBrowser;
