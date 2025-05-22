import { LabelRequired } from '@renderer/components/label-required';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select';
import { Switch } from '@renderer/components/ui/switch';
import { cn } from '@renderer/lib/utils';

export interface InputProps {
    id: string; // Identificador único para o input
    label: string; // Rótulo do input
    placeholder?: string; // Placeholder opcional
    isRequired?: boolean; // Indica se o campo é obrigatório
    error?: string; // Mensagem de erro (opcional)
    isTouched?: boolean; // Indica se o campo foi tocado/interagido
    [key: string]: any; // Permite outras props adicionais
    classNameLabel?: string; // Indica se o campo tem rótulo
}

export interface TextInputProps extends InputProps {
    value?: string; // Valor do input
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; // Função chamada quando o valor muda
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void; // Função chamada quando o input perde o foco
}

export interface SelectInputProps extends InputProps {
    value?: string; // Valor do input
    options: { value: string; label: string }[];
    onChange: (value: string | boolean) => void;
    onBlur?: (value: string) => void;
}

export interface CheckboxProps extends InputProps {
    value?: boolean;
    onChange: (value: boolean) => void;
    onBlur?: (value: string) => void;
}

// Helper Component: TextInput
export const TextInput = ({
    id,
    label,
    placeholder = '',
    value,
    isRequired = false,
    onChange,
    onBlur,
    error,
    isTouched = false,
    ...props
}: TextInputProps) => {
    return (
        <div className="flex flex-col gap-2">
            {isRequired ? (
                <LabelRequired>{label}</LabelRequired>
            ) : (
                <Label htmlFor={id}>{label}</Label>
            )}
            <Input
                id={id}
                type="text"
                className={cn(
                    'w-full',
                    isTouched && error && 'border-destructive'
                )}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                {...props}
            />
            {isTouched && error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
        </div>
    );
};

// Helper Component: SelectInput
export const SelectInput = ({
    label,
    id,
    options,
    value,
    isRequired = false,
    onChange,
    isTouched = false,
    error,
    classNameLabel,
    placeholder,
}: SelectInputProps) => (
    <div className="flex flex-col gap-2">
        {isRequired ? (
            <LabelRequired>{label}</LabelRequired>
        ) : (
            <Label htmlFor={id} className={cn(classNameLabel)}>
                {label}
            </Label>
        )}
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger id={id} className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
       {/*  <IGRPCombobox
            options={options}
            value={value as string}
            onChange={(e) => {
                onChange(e as string);
            }}
            placeholder={placeholder ?? `Select ${label}`}
            className={cn(
                'w-full h-9',
                isTouched && error && 'border-destructive'
            )}
        /> */}
        {error && isTouched && (
            <p className="text-xs text-destructive">{error}</p>
        )}
    </div>
);

// Helper Component: CheckboxInput
export const CheckboxInput = ({
    label,
    id,
    value,
    isRequired = false,
    onChange,
    isTouched = false,
    error,
}: CheckboxProps) => (
    <div className="flex flex-1 gap-2">
        {isRequired ? (
            <LabelRequired>{label}</LabelRequired>
        ) : (
            <Label htmlFor={id}>{label}</Label>
        )}
        <Checkbox checked={value} onCheckedChange={onChange} />
        {error && isTouched && (
            <p className="text-xs text-destructive">{error}</p>
        )}
    </div>
);

export const SwitchInput = ({
    label,
    id,
    value,
    isRequired = false,
    onChange,
    isTouched = false,
    error,
}: CheckboxProps) => (
    <div className="flex flex-1 gap-2">
        {isRequired ? (
            <LabelRequired>{label}</LabelRequired>
        ) : (
            <Label htmlFor={id}>{label}</Label>
        )}
        <Switch checked={value} onCheckedChange={onChange} />
        {error && isTouched && (
            <p className="text-xs text-destructive">{error}</p>
        )}
    </div>
);
