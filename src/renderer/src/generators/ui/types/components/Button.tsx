import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { IGRPButton } from '@igrp/igrp-framework-react-design-system';

export interface UiButtonProps {
    index: number;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const UiButton = ({ comp }: UiButtonProps) => {
    const { properties, componentName } = comp;

    const { label } = properties;

    const { commonProperties, iconProperties, ...args } = properties;

    return <IGRPButton {...args}>{label || componentName}</IGRPButton>;
};

export default UiButton;
