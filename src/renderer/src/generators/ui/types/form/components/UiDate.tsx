import { Label } from '@renderer/components/ui/label';
import { DroppedComponent } from '../../interfaces';
import { useState } from 'react';
import { DateRangePicker } from '@igrp/igrp-design-system';

interface InputDateProps {
    comp: DroppedComponent;
    componentId: string;
    onEdit: () => void;
}

const InputDate: React.FC<InputDateProps> = ({ comp, componentId }) => {
    const { label } = comp.config;

    const [date, _setDate] = useState();

    return (
        <div className="flex flex-col space-y-3">
            <Label htmlFor={componentId} className="mb-2">
                {label}
            </Label>
            <DateRangePicker date={date} setDate={() => console.log()} />
        </div>
    );
};

export default InputDate;
