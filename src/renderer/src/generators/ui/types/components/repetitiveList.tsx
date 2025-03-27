import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { IGRPRepetitiveComponent } from '@igrp/igrp-framework-react-design-system';
import { useState } from 'react';

export interface UiRepListProps {
    index: number;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const UiRepetitiveComponent = () => {
    const [items, _setItems] = useState([]);
    return <IGRPRepetitiveComponent items={items}></IGRPRepetitiveComponent>;
};

export default UiRepetitiveComponent;
