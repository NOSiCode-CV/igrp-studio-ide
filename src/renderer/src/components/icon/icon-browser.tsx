import { useMemo, useRef, useState, useEffect } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { icons } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../ui/command';
import { getLabel } from '@renderer/utils/helpers';
import { FixedSizeGrid as Grid } from 'react-window';
import { useDebounce } from 'use-debounce';

interface IconBrowserProps {
    selectedIcon: string;
    onSelectedIcon: (icon: string) => void;
}

const IconBrowser = ({ selectedIcon, onSelectedIcon }: IconBrowserProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 200);
    const commandRef = useRef<HTMLDivElement>(null);

    const iconsList = useMemo(
        () => Object.keys(icons) as (keyof typeof icons)[],
        []
    );

    const filteredIcons = useMemo(() => {
        if (!debouncedSearch) return iconsList;
        return iconsList.filter((name) =>
            name.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [iconsList, debouncedSearch]);

    const handleIconClick = (iconName: string) => {
        onSelectedIcon(iconName);
        setOpen(false);
    };

    const columnCount = 8;

    const Cell = ({ columnIndex, rowIndex, style }: any) => {
        const index = rowIndex * columnCount + columnIndex;
        if (index >= filteredIcons.length) return null;

        const iconName = filteredIcons[index];
        const IconComponent = icons[iconName];

        return (
            <div style={style} className="p-2 flex items-center justify-center">
                <CommandItem
                    key={iconName}
                    onSelect={() => handleIconClick(iconName)}
                    className="cursor-pointer"
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <IconComponent className="h-6 w-6" />
                        </TooltipTrigger>
                        <TooltipContent>{getLabel(iconName)}</TooltipContent>
                    </Tooltip>
                </CommandItem>
            </div>
        );
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="relative" ref={commandRef}>
                    <Command className="rounded-lg border shadow-md">
                        <CommandInput
                            placeholder="Type to search icon ..."
                            value={search}
                            onFocus={() => setOpen(true)}
                            onValueChange={(val) => {
                                setSearch(val);
                                setOpen(true);
                            }}
                            className="h-9"
                        />
                        {open && (
                            <CommandList className="max-h-[300px] overflow-auto">
                                <CommandEmpty>No icons found.</CommandEmpty>
                                <CommandGroup>
                                    <Grid
                                        columnCount={8}
                                        columnWidth={40}
                                        height={300}
                                        rowCount={Math.ceil(
                                            filteredIcons.length / 8
                                        )}
                                        rowHeight={40}
                                        width={400}
                                    >
                                        {Cell}
                                    </Grid>
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
