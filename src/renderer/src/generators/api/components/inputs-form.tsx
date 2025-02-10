import { Combobox } from '@igrp/igrp-design-system';
import { LabelRequired } from '@renderer/components/required';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';

// Helper Component: TextInput
export const TextInput = ({
    label,
    id,
    placeholder,
    value,
    isRequired = false,
    onChange,
    onBlur,
    error,
}) => (
    <div className="space-y-2">
        {isRequired ? (
            <LabelRequired>{label}</LabelRequired>
        ) : (
            <Label htmlFor={id}>{label}</Label>
        )}
        <Input
            id={id}
            type="text"
            className={`w-full  ${error ? 'border-red-500' : ''}`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

// Helper Component: SelectInput
export const SelectInput = ({
    label,
    id,
    options,
    value,
    isRequired = false,
    onChange,
    error,
}) => (
    <div className="space-y-2">
        {isRequired ? (
            <LabelRequired>{label}</LabelRequired>
        ) : (
            <Label htmlFor={id}>{label}</Label>
        )}
        <Combobox
            name={id}
            options={options}
            value={value}
            onChange={onChange}
            placeholder={`Select ${label}`}
            className={`w-full h-9 ${error ? 'border-red-500' : ''}`}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);
