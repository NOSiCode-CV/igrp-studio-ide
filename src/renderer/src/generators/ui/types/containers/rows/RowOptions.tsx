import { Button } from "@renderer/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@renderer/components/ui/dropdown-menu";
import { Copy, LayoutGrid, Move, Plus, Trash } from "lucide-react";
import { useState } from "react";

interface RowOptionsProps {
    onClickAddControl: (type: string) => void;
    onClickStructure: (layout: string) => void;
    onClickDeleteSection: () => void;
}

const RowOptions = ({ onClickAddControl, onClickStructure, onClickDeleteSection }: RowOptionsProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const closeDropdown = () => setDropdownOpen(false);

    const gridStructures = [
        [12], [6, 6], [4, 4, 4], [3, 3, 3, 3], [8, 4], [4, 8], [9, 3], [3, 9], [10, 2], [2, 10]
    ];

    return (
        <div id="row-tools">
            {/* Top-aligned button */}
            <Button
                className="size-7 absolute left-1/2 transform -translate-x-1/2 top-[-20px] p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 rounded-full bg-igrp text-white z-50 cursor-pointer"
                title="Add New Row at Top"
                onClick={() => onClickAddControl("top")}
            >
                <Plus className="h-7 w-7" />
            </Button>

            {/* Bottom-aligned button */}
            <Button
                className="size-7 absolute left-1/2 transform -translate-x-1/2 bottom-[-15px] p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 rounded-full bg-igrp text-white z-50 cursor-pointer"
                title="Add New Row at Bottom"
                onClick={() => onClickAddControl("bottom")}
            >
                <Plus className="h-7 w-7" />
            </Button>

            <div className="absolute z-10 left-0 top-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 bg-gray-600 text-white">
                <ul className="flex">
                    <li className="flex items-center cursor-pointer" title="Ordenar">
                        <a className="flex items-center p-1 hover:bg-gray-700 rounded" href="#" onClick={(e) => e.preventDefault()}>
                            <Move className="h-4" />
                        </a>
                    </li>

                    <li className="flex items-center cursor-pointer" title="Clonar">
                        <a className="flex items-center p-1 hover:bg-gray-700 rounded" href="#" onClick={(e) => e.preventDefault()}>
                            <Copy className="h-4" />
                        </a>
                    </li>

                    <li className="flex items-center cursor-pointer" title="Estrutura">
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
                                                        className="bg-muted bg-[#0AB39C] hover:bg-igrp transition-colors"
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
                    </li>

                    <li
                        className="flex items-center cursor-pointer"
                        title="Eliminar Seção"
                        onClick={(e) => {
                            e.preventDefault();
                            onClickDeleteSection();
                        }}
                    >
                        <a className="flex items-center p-1 hover:bg-gray-700 rounded" href="#">
                            <Trash className="h-4" />
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default RowOptions;
