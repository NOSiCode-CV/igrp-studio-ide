import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@renderer/components/ui/dropdown-menu";
import { LayoutGrid } from "lucide-react";
import { useState } from "react";

interface StructureDropdownProps {
    onClickStructure: (layout: string) => void;
}

const StructureDropdown = ({ onClickStructure }: StructureDropdownProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const closeDropdown = () => setDropdownOpen(false);

    const gridStructures = [
        [12], [6, 6], [4, 4, 4], [3, 3, 3, 3], [8, 4], [4, 8], [9, 3], [3, 9], [10, 2], [2, 10]
    ];

    return (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
                <a className="flex items-center p-1 space-x-2 hover:bg-gray-700 rounded" href="#">
                    <LayoutGrid className="h-4 w-4" />
                </a>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" onPointerLeave={closeDropdown}>
                <DropdownMenuLabel>Estrutura</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-3 gap-2 p-2">
                    {gridStructures.map((structure, index) => (
                        <DropdownMenuItem
                            key={index}
                            onSelect={() => onClickStructure(structure.join(','))}
                            className="p-0 focus:bg-transparent"
                        >
                            <div className="flex w-full cursor-pointer rounded border p-1 hover:bg-accent gap-1">
                                {structure.map((col, i) => (
                                    <div
                                        key={i}
                                        className="bg-[#0AB39C] hover:bg-igrp transition-colors"
                                        style={{ width: `${(col / 12) * 100}%`, height: '20px' }}
                                    >
                                    </div>
                                ))}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default StructureDropdown;