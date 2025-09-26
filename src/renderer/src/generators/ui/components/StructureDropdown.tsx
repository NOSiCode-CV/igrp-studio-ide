import {
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuLabelPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuSeparatorPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipProviderPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface StructureDropdownProps {
    onClickStructure: (layout: string) => void;
}

const StructureDropdown = ({ onClickStructure }: StructureDropdownProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { t } = useTranslation();

    const closeDropdown = () => setDropdownOpen(false);

    const gridStructures = [
        [12],
        [6, 6],
        [4, 4, 4],
        [3, 3, 3, 3],
        [8, 4],
        [4, 8],
        [9, 3],
        [3, 9],
        [10, 2],
        [2, 10],
    ];

    return (
        <IGRPTooltipProviderPrimitive>
            <IGRPDropdownMenuPrimitive
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
            >
                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive>
                        <IGRPDropdownMenuTriggerPrimitive asChild>
                            <a
                                className="flex items-center p-1 space-x-2 hover:bg-gray-700 rounded"
                                href="#"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </a>
                        </IGRPDropdownMenuTriggerPrimitive>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        {t('columnsSettings')}
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
                <IGRPDropdownMenuContentPrimitive
                    className="w-56"
                    onPointerLeave={closeDropdown}
                >
                    <IGRPDropdownMenuLabelPrimitive>
                        {t('columnsSettings')}
                    </IGRPDropdownMenuLabelPrimitive>
                    <IGRPDropdownMenuSeparatorPrimitive />
                    <div className="grid grid-cols-3 gap-2 p-2">
                        {gridStructures.map((structure, index) => (
                            <IGRPDropdownMenuItemPrimitive
                                key={index}
                                onSelect={() =>
                                    onClickStructure(structure.join(','))
                                }
                                className="p-0 focus:bg-transparent"
                            >
                                <div className="flex w-full cursor-pointer rounded border p-1 hover:bg-accent gap-1">
                                    {structure.map((col, i) => (
                                        <div
                                            key={i}
                                            className="bg-muted-foreground hover:bg-primary transition-colors"
                                            style={{
                                                width: `${(col / 12) * 100}%`,
                                                height: '20px',
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </IGRPDropdownMenuItemPrimitive>
                        ))}
                    </div>
                </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>
        </IGRPTooltipProviderPrimitive>
    );
};

export default StructureDropdown;
