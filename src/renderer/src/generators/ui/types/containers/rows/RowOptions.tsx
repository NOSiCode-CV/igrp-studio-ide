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
        <div id="row-tools" className="relative flex flex-col items-center justify-between h-full ">
            {/* Top-aligned button */}
            <Button
                className="absolute top-0 text-white flex items-center justify-center cursor-pointer p-2 hover:bg-gray-700 rounded-full"
                title="Add New Row at Top"
                onClick={() => onClickAddControl("top")}
            >
                <Plus />
            </Button>

            {/* Bottom-aligned button */}
            <Button
                className="absolute bottom-0 text-white flex items-center justify-center cursor-pointer p-2 hover:bg-gray-700 rounded-full"
                title="Add New Row at Bottom"
                onClick={() => onClickAddControl("bottom")}
            >
                <Plus />
            </Button>

            <div className="row-options mt-4">
                <ul className="flex space-x-2">
                    <li className="flex items-center cursor-pointer" title="Ordenar">
                        <a className="flex items-center p-2 hover:bg-gray-700 rounded" href="#" onClick={(e) => e.preventDefault()}>
                            <Move className="h-4" />
                        </a>
                    </li>

                    <li className="flex items-center cursor-pointer" title="Clonar">
                        <a className="flex items-center p-2 hover:bg-gray-700 rounded" href="#" onClick={(e) => e.preventDefault()}>
                            <Copy className="h-4" />
                        </a>
                    </li>

                    <li className="flex items-center cursor-pointer" title="Estrutura">
                        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <a className="flex items-center p-2 space-x-2 hover:bg-gray-700 rounded" href="#">
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
                                            <div className="flex w-full cursor-pointer rounded border p-1 hover:bg-accent">
                                                {structure.map((col, i) => (
                                                    <div
                                                        key={i}
                                                        className="bg-muted"
                                                        style={{ width: `${(col / 12) * 100}%`, height: '20px' }}
                                                    />
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
                        <a className="flex items-center p-2 hover:bg-gray-700 rounded" href="#">
                            <Trash className="h-4" />
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default RowOptions;
