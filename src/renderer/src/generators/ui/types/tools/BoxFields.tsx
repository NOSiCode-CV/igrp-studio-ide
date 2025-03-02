import React from 'react';
import RowTools from './RowTools';

interface BoxProps {
    children: React.ReactElement;
    id: string;
    className?: string;
    onEdit: () => void;
    index: number;
}

const BoxField = ({ children, id, index, onEdit }: BoxProps) => {
    return (
        <div className="relative group/field">
            {React.cloneElement(children)}
            <div className="absolute top-0 right-0 mt-1 p-1 bg-gray-600 text-white rounded opacity-0 group-hover/field:opacity-100 transition-opacity duration-200 shadow-lg">
                <RowTools id={id} onEdit={() => onEdit()} index={index} />
            </div>
        </div>
    );
};

export default BoxField;
