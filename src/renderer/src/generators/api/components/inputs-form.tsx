import { IGRPCombobox } from '@renderer/components/combobox';
import { LabelRequired } from '@renderer/components/required';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { cn } from '@renderer/lib/utils';

export interface InputProps {
    id: string; // Identificador único para o input
    label: string; // Rótulo do input
    placeholder?: string; // Placeholder opcional
    value: string; // Valor do input
    isRequired?: boolean; // Indica se o campo é obrigatório
    error?: string; // Mensagem de erro (opcional)
    isTouched?: boolean; // Indica se o campo foi tocado/interagido
    [key: string]: any; // Permite outras props adicionais
}

export interface TextInputProps extends InputProps {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; // Função chamada quando o valor muda
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => void; // Função chamada quando o input perde o foco
}

export interface SelectInputProps extends InputProps {
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    onBlur: (value: string) => void;
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
                className={cn('w-full', isTouched && error && 'border-red-500')}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                {...props}
            />
            {isTouched && error && (
                <p className="text-xs text-red-500">{error}</p>
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
}: SelectInputProps) => (
    <div className="flex flex-col gap-2">
        {isRequired ? (
            <LabelRequired>{label}</LabelRequired>
        ) : (
            <Label htmlFor={id}>{label}</Label>
        )}
        <IGRPCombobox
            options={options}
            value={value}
            onChange={onChange}
            placeholder={`Select ${label}`}
            className={cn('w-full h-9', isTouched && error && 'border-red-500')}
        />
        {error && isTouched && <p className="text-xs text-red-500">{error}</p>}
    </div>
);
