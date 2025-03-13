import React from 'react';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import FieldTools from './FieldTools';

interface BoxProps {
    children: React.ReactElement;
    comp: StructuredComponent;
    parentComp: StructuredComponent;
    className?: string;
    onEdit: () => void;
    index: number;
}

const BoxField = ({ children, index, comp, parentComp, onEdit }: BoxProps) => {
    return (
        <div className="relative group/field">
            {React.cloneElement(children)}
            <div className="absolute top-0 right-0 mt-1 bg-gray-600 text-white rounded opacity-0 group-hover/field:opacity-100 transition-opacity duration-200 shadow-lg">
                <FieldTools
                    comp={comp}
                    parentComp={parentComp}
                    onEdit={() => onEdit()}
                    index={index}
                />
            </div>
        </div>
    );
};

export default BoxField;
