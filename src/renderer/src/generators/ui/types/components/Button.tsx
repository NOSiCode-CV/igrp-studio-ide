import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { IGRPButton } from '@igrp/igrp-framework-react-design-system';

export interface UiButtonProps {
    index: number;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const UiButton = ({ comp }: UiButtonProps) => {
    const { properties, componentName } = comp;

    const { variant, size, customClasses, label } = properties;

    return (
        <IGRPButton variant={variant} size={size} className={customClasses}>
            {label || componentName}
        </IGRPButton>
    );
};

export default UiButton;
