import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { icons } from 'lucide-react';
import { getLabel } from '@renderer/utils';
import {
    FixedSizeGrid as Grid,
    type FixedSizeGrid as GridType,
} from 'react-window';
import { useDebounce } from 'use-debounce';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { IGRPInputSearch } from '@igrp/igrp-framework-react-design-system';
import { Button } from '../ui/button';

interface IconBrowserProps {
    selectedIcon: string;
    onSelectedIcon: (icon: string) => void;
}

const IconBrowser = ({ selectedIcon, onSelectedIcon }: IconBrowserProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 200);

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

    const gridRef = useRef<GridType>(null);

    const columnCount = 8;
    const rowCount = Math.ceil(filteredIcons.length / columnCount);

    useEffect(() => {
        gridRef.current?.scrollTo({ scrollTop: 0 });
    }, [filteredIcons]);

    const Cell = ({ columnIndex, rowIndex, style }: any) => {
        const index = rowIndex * columnCount + columnIndex;
        if (index >= filteredIcons.length) return null;

        const iconName = filteredIcons[index];
        const IconComponent = icons[iconName];

        return (
            <div
                style={style}
                className="p-2 flex items-center justify-center cursor-pointer"
                key={index}
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <IconComponent
                            onClick={() => handleIconClick(iconName)}
                        />
                    </TooltipTrigger>
                    <TooltipContent>{getLabel(iconName)}</TooltipContent>
                </Tooltip>
            </div>
        );
    };

    const SelectedIconComp = icons[selectedIcon as keyof typeof icons];

    return (
        <TooltipProvider>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button size={'sm'} variant={'outline'}>
                        {SelectedIconComp && <SelectedIconComp />}
                        {selectedIcon || 'Select Icon'}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[435px] z-[60]">
                    <IGRPInputSearch
                        placeholder="Type to search icon ..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                    />
                    <Grid
                        ref={gridRef}
                        columnCount={columnCount}
                        columnWidth={50}
                        height={300}
                        rowCount={rowCount}
                        rowHeight={50}
                        width={columnCount * 50 + 20}
                    >
                        {Cell}
                    </Grid>
                </PopoverContent>
            </Popover>
        </TooltipProvider>
    );
};

export default IconBrowser;
