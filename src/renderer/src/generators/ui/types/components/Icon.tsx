import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';
import { Home } from 'lucide-react';

export interface IconProps {
    index: number;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const Icon = ({ comp }: IconProps) => {
    const { properties } = comp;

    const { iconName } = properties;

    const { commonProperties, iconProperties, ...args } = properties;

    return <IGRPIcon iconName={iconName || Home} {...args}></IGRPIcon>;
};

export default Icon;
