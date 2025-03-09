import RowTools from '../tools/RowTools';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { IGRPButton } from '@igrp/igrp-framework-react-design-system';

export interface UiButtonProps {
    index: number;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const UiButton = ({ comp, index }: UiButtonProps) => {
    const { properties, id: componentId,  componentName } = comp;

    const { variant, size, customClasses, label } = properties;

    return (
        <div className="relative group">
            <IGRPButton
                onClick={(e) => e.preventDefault()}
                variant={variant}
                size={size}
                className={customClasses}
            >
                {label || componentName}
            </IGRPButton>
            <div className="absolute top-0 right-0 mt-1 px-2 py-1 bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                <RowTools
                    id={componentId}
                    onEdit={() => console.log()}
                    index={index}
                />
            </div>
        </div>
    );
};

export default UiButton;
