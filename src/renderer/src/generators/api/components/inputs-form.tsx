import {
  IGRPCheckboxPrimitive,
  IGRPCombobox,
  IGRPInputPrimitive,
  IGRPLabelPrimitive,
  IGRPSwitchPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Info } from 'lucide-react'

import { LabelRequired } from '@renderer/components/label-required'
import { cn } from '@renderer/lib/utils'

export interface InputProps {
  id: string // Identificador único para o input
  label: string // Rótulo do input
  placeholder?: string // Placeholder opcional
  isRequired?: boolean // Indica se o campo é obrigatório
  error?: string // Mensagem de erro (opcional)
  isTouched?: boolean // Indica se o campo foi tocado/interagido
  [key: string]: any // Permite outras props adicionais
  classNameLabel?: string // Indica se o campo tem rótulo
}

export interface TextInputProps extends InputProps {
  value?: string // Valor do input
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void // Função chamada quando o valor muda
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void // Função chamada quando o input perde o foco
}

export interface SelectInputProps extends InputProps {
  value?: string // Valor do input
  options: { value: string; label: string }[]
  onChange: (value: string | boolean) => void
  onBlur?: (value: string) => void
}

export interface CheckboxProps extends InputProps {
  value?: boolean
  onChange: (value: boolean) => void
  onBlur?: (value: string) => void
  /** Optional text shown in a tooltip next to the label to explain the checkbox purpose. */
  info?: string
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
}: TextInputProps): React.ReactNode => {
  return (
    <div className="flex flex-col gap-2">
      {isRequired ? (
        <LabelRequired>{label}</LabelRequired>
      ) : (
        <IGRPLabelPrimitive htmlFor={id}>{label}</IGRPLabelPrimitive>
      )}
      <IGRPInputPrimitive
        id={id}
        type="text"
        className={cn('w-full', isTouched && error && 'border-destructive')}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        {...props}
      />
      {isTouched && error && <p className="text-xs text-destructive">{error}</p>}
      {props.helperText && <p className="text-sm text-muted-foreground">{props.helperText}</p>}
    </div>
  )
}

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
  placeholder
}: SelectInputProps): React.ReactNode => (
  <div className="flex flex-col gap-2">
    {isRequired ? (
      <LabelRequired>{label}</LabelRequired>
    ) : (
      <IGRPLabelPrimitive htmlFor={id} className={cn(classNameLabel)}>
        {label}
      </IGRPLabelPrimitive>
    )}
    <IGRPCombobox
      name={id}
      options={options}
      value={value as string}
      onChange={(e) => {
        onChange(e as string)
      }}
      placeholder={placeholder ?? `Select ${label}`}
      className={cn('w-full h-9', isTouched && error && 'border-destructive')}
    />
    {error && isTouched && <p className="text-xs text-destructive">{error}</p>}
  </div>
)

// Helper Component: CheckboxInput
export const CheckboxInput = ({
  label,
  id,
  value,
  isRequired = false,
  onChange,
  isTouched = false,
  error,
  info
}: CheckboxProps): React.ReactNode => (
  <div className="flex flex-1 flex-col gap-2">
    <div className="flex flex-1 items-center gap-2">
      <IGRPCheckboxPrimitive name={id} checked={value} onCheckedChange={onChange} />
      {isRequired ? (
        <LabelRequired>{label}</LabelRequired>
      ) : (
        <IGRPLabelPrimitive htmlFor={id}>{label}</IGRPLabelPrimitive>
      )}
      {info != null && info !== '' && (
        <IGRPTooltipPrimitive>
          <IGRPTooltipTriggerPrimitive asChild>
            <span
              className="inline-flex cursor-help text-muted-foreground hover:text-foreground"
              tabIndex={0}
            >
              <Info className="h-4 w-4" aria-hidden />
            </span>
          </IGRPTooltipTriggerPrimitive>
          <IGRPTooltipContentPrimitive>
            <p className="max-w-xs text-sm">{info}</p>
          </IGRPTooltipContentPrimitive>
        </IGRPTooltipPrimitive>
      )}
    </div>
    {error && isTouched && <p className="text-xs text-destructive">{error}</p>}
  </div>
)

export const SwitchInput = ({
  label,
  id,
  value,
  isRequired = false,
  onChange,
  isTouched = false,
  error
}: CheckboxProps): React.ReactNode => (
  <div className="flex flex-1 gap-2">
    {isRequired ? (
      <LabelRequired>{label}</LabelRequired>
    ) : (
      <IGRPLabelPrimitive htmlFor={id}>{label}</IGRPLabelPrimitive>
    )}
    <IGRPSwitchPrimitive name={id} checked={value} onCheckedChange={onChange} />
    {error && isTouched && <p className="text-xs text-destructive">{error}</p>}
  </div>
)
