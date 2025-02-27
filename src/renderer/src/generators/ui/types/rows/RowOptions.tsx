import { Button } from '@renderer/components/ui/button';
import { Copy, Move, Plus, Trash } from 'lucide-react';

interface RowOptionsProps {
    onClickAddControl: (type: string) => void;
    onClickStructure: (layout: string) => void;
    onClickDeleteSection: () => void;
}

const RowOptions = ({
    onClickAddControl,
    onClickDeleteSection,
}: RowOptionsProps) => {
    return (
        <div id="row-tools">
            {/* Top-aligned button */}
            <Button
                className="size-7 absolute left-1/2 transform -translate-x-1/2 top-[-20px] p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 rounded-full bg-igrp text-white z-50 cursor-pointer"
                title="Add New Row at Top"
                onClick={() => onClickAddControl('top')}
            >
                <Plus className="h-7 w-7" />
            </Button>

            {/* Bottom-aligned button */}
            <Button
                className="size-7 absolute left-1/2 transform -translate-x-1/2 bottom-[-15px] p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 rounded-full bg-igrp text-white z-50 cursor-pointer"
                title="Add New Row at Bottom"
                onClick={() => onClickAddControl('bottom')}
            >
                <Plus className="h-7 w-7" />
            </Button>

            <div className="absolute z-10 left-0 -top-6 rounded opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 bg-gray-600 text-white">
                <ul className="flex">
                    <li
                        className="flex items-center cursor-pointer"
                        title="Ordenar"
                    >
                        <a
                            className="flex items-center p-1 hover:bg-gray-700 rounded"
                            href="#"
                            onClick={(e) => e.preventDefault()}
                        >
                            <Move className="h-4" />
                        </a>
                    </li>

                    <li
                        className="flex items-center cursor-pointer"
                        title="Clonar"
                    >
                        <a
                            className="flex items-center p-1 hover:bg-gray-700 rounded"
                            href="#"
                            onClick={(e) => e.preventDefault()}
                        >
                            <Copy className="h-4" />
                        </a>
                    </li>

                    {/* Use the new StructureDropdown component */}
                    {/*  <li className="flex items-center cursor-pointer" title="Estrutura">
                        <StructureDropdown onClickStructure={onClickStructure} />
                    </li> */}

                    <li
                        className="flex items-center cursor-pointer"
                        title="Eliminar Seção"
                        onClick={(e) => {
                            e.preventDefault();
                            onClickDeleteSection();
                        }}
                    >
                        <a
                            className="flex items-center p-1 hover:bg-gray-700 rounded"
                            href="#"
                        >
                            <Trash className="h-4" />
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default RowOptions;
