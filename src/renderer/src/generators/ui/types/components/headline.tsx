import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { IGRPHeadline } from '@igrp/igrp-framework-react-design-system';

export interface HeadLineProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const headline: React.FC<HeadLineProps> = ({ comp }) => {
    const { properties } = comp;
    const { title, description } = properties;

    return <IGRPHeadline title={title} description={description} />;
};

export default headline;
