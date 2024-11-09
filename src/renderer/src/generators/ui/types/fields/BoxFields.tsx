import React from "react";
import RowTools from "../tools/RowTools";

interface BoxProps {
    children: React.ReactElement,
    id: string;
    size: number;
    className?: string;
    onEdit: () => void;
    refProp?: any;
    draggableProps?: any;
    dragHandleProps?: any;
    style?: any;
}

const BoxField = ({ children, id, onEdit }: BoxProps) => {

    return (
        <React.Fragment>
            {React.cloneElement(children, { id })}
            <RowTools id={id} onEdit={() => onEdit()} />
        </React.Fragment >
    );
}

export default BoxField