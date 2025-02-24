import { Label } from '@renderer/components/ui/label';
import { useState } from 'react';
import { DateRangePicker } from '@igrp/igrp-framework-react-design-system';
import { DroppedComponent } from '@renderer/generators/ui/interfaces';

interface InputDateProps {
    comp: DroppedComponent;
    componentId: string;
    onEdit: () => void;
}

const DatePicker: React.FC<InputDateProps> = ({ comp, componentId }) => {
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

export default DatePicker;
