import { useMemo, useState } from 'react';
import { icons } from 'lucide-react';
import { getLabel } from '@renderer/utils';
import { useDebounce } from 'use-debounce';
import { IGRPInputSearch, IGRPPopoverContentPrimitive, IGRPPopoverPrimitive, IGRPPopoverTriggerPrimitive, IGRPTooltipContentPrimitive, IGRPTooltipPrimitive, IGRPTooltipProviderPrimitive, IGRPTooltipTriggerPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';

interface IconBrowserProps {
    selectedIcon: string;
    onSelectedIcon: (icon: string) => void;
}

const IconBrowserNew = ({ selectedIcon, onSelectedIcon }: IconBrowserProps) => {
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

    const SelectedIconComp = icons[selectedIcon as keyof typeof icons];

    return (
        <IGRPTooltipProviderPrimitive>
            <IGRPPopoverPrimitive open={open} onOpenChange={setOpen}>
                <IGRPPopoverTriggerPrimitive asChild>
                    <IGRPButtonPrimitive size={'sm'} variant={'outline'}>
                        {SelectedIconComp && <SelectedIconComp />}
                        {selectedIcon || 'Select Icon'}
                    </IGRPButtonPrimitive>
                    </IGRPPopoverTriggerPrimitive>

                <IGRPPopoverContentPrimitive className="w-[435px] z-[60]">
                    <IGRPInputSearch
                        placeholder="Type to search icon ..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                    />
                    <div className="max-h-[300px] overflow-y-auto">
                        <div className="grid grid-cols-8 gap-2 p-2">
                            {filteredIcons.map((iconName, index) => {
                                const IconComponent = icons[iconName];
                                return (
                                    <div
                                        key={index}
                                        className="p-2 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded"
                                    >
                                        <IGRPTooltipPrimitive>
                                            <IGRPTooltipTriggerPrimitive asChild>
                                                <IconComponent
                                                    onClick={() =>
                                                        handleIconClick(
                                                            iconName
                                                        )
                                                    }
                                                    className="w-5 h-5"
                                                />
                                            </IGRPTooltipTriggerPrimitive>
                                            <IGRPTooltipContentPrimitive>
                                                {getLabel(iconName)}
                                            </IGRPTooltipContentPrimitive>
                                        </IGRPTooltipPrimitive>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </IGRPPopoverContentPrimitive>
            </IGRPPopoverPrimitive>
        </IGRPTooltipProviderPrimitive>
    );
};

export default IconBrowserNew;
