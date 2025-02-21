import React from "react";
import RowTools from "../tools/RowTools";

interface BoxProps {
    children: React.ReactElement,
    id: string;
    className?: string;
    onEdit: () => void;
    refProp?: any;
    draggableProps?: any;
    dragHandleProps?: any;
    style?: any;
}

const BoxField = ({ children, id, onEdit }: BoxProps) => {

    return (
        <div className="relative group">
            {React.cloneElement(children, { id })}
            <div className="absolute top-0 right-0 mt-1 p-1 bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                <RowTools id={id} onEdit={() => onEdit()} />
            </div>
        </div>
    );
}

export default BoxField