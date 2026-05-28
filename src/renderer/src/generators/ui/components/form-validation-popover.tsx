import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { IGRPSeparator, IGRPSwitch } from '@igrp/igrp-framework-react-design-system'
import { toInitCap } from '@renderer/utils'
import { AlertCircle, Shield } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FieldValidationMetadata {
    message?: string
    validationKey: string
}

interface FormValidationPopoverProps {
    children?: ReactNode
    index: number
    field: any
    fieldType: string
    changeValue: (element: string, position: number, value: any) => void
}

/** Zod allows 0 for min/max/minLength/maxLength; do not treat it as unset. */
function hasValidationValue(value: unknown): boolean {
    if (typeof value === 'number') return !Number.isNaN(value)
    return value !== undefined && value !== null && value !== '' && value !== false
}

function formatValidationInputValue(value: unknown): string | number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') return value
    return ''
}

export function FormValidationPopover({
    index,
    field,
    fieldType,
    changeValue
}: FormValidationPopoverProps) {
    const { t } = useTranslation()

    const [isNumber, setIsNumber] = useState(false)
    const [isString, setIsString] = useState(false)
    const [isBoolean, setIsBoolean] = useState(false)
    const [isDate, setIsDate] = useState(false)
    const [isFile, setIsFile] = useState(false)

    const handleValidationKeyChange = (
        key: string,
        value: string | boolean | number | unknown[] | undefined
    ) => {
        const currentValidation = field?.validation || {}
        if (value === undefined || value === null || value === '') {
            const { [key]: _removed, ...rest } = currentValidation
            changeValue('validation', index, rest)
            return
        }
        changeValue('validation', index, {
            ...currentValidation,
            [key]: value
        })
    }

    /**
     * Aligned with the engine's FieldTypes constant. 'string'/'integer'/
     * 'long'/'double'/'float'/'textarea' values come from legacy data —
     * left in the lookup so projects loaded before R1 still render the
     * right validation options until the type is normalised.
     */
    useEffect(() => {
        const numberLike = ['number', 'range', 'integer', 'long', 'double', 'float']
        const stringLike = [
            'text',
            'password',
            'tel',
            'color',
            'select',
            'select2',
            'radio',
            'string',
            'textarea',
            'email',
            'url',
            'uuid'
        ]
        const booleanLike = ['checkbox', 'switch', 'boolean']
        const dateLike = ['date', 'time', 'datetime']

        setIsNumber(numberLike.includes(fieldType))
        setIsString(stringLike.includes(fieldType))
        setIsBoolean(booleanLike.includes(fieldType))
        setIsDate(dateLike.includes(fieldType))
        setIsFile(fieldType === 'file')
    }, [fieldType])

    /**
     * 'isEmail' was originally tracked separately; with the engine
     * vocabulary email is a text input + validation.email constraint,
     * so we treat string-like fields as eligible for the email switch.
     */
    const isEmail = isString

    const shouldShowValidation = (validation: string) => {
        switch (validation) {
            case 'min':
            case 'max':
                return isNumber || isFile
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
            case 'positive':
            case 'negative':
            case 'int':
            case 'finite':
                return isNumber
            case 'minLength':
            case 'maxLength':
            case 'regex':
            case 'startsWith':
            case 'endsWith':
            case 'includes':
                return isString
            case 'email':
                return isString || isEmail
            case 'url':
                return isString
            case 'uuid':
                return isString
            case 'minDate':
            case 'maxDate':
                return isDate
            case 'mime':
                return isFile
            case 'required':
            case 'optional':
                return true
            default:
                return true
        }
    }

    const getValidationOptions = () => {
        const stringValidations = [
            'minLength',
            'maxLength',
            'regex',
            'email',
            'url',
            'uuid',
            'startsWith',
            'endsWith',
            'includes'
        ]
        const numberValidations = [
            'min',
            'max',
            'gt',
            'gte',
            'lt',
            'lte',
            'positive',
            'negative',
            'int',
            'finite'
        ]
        const dateValidations = ['minDate', 'maxDate']
        const fileValidations = ['min', 'max', 'mime']
        const booleanValidations: string[] = []

        let validations: string[] = []

        if (isString || isEmail) {
            validations = [...validations, ...stringValidations]
        }
        if (isNumber) {
            validations = [...validations, ...numberValidations]
        }
        if (isDate) {
            validations = [...validations, ...dateValidations]
        }
        if (isFile) {
            validations = [...validations, ...fileValidations]
        }
        if (isBoolean) {
            validations = [...validations, ...booleanValidations]
        }

        return validations
    }

    /**
     * Custom error messages live in `field.validation.errors` as a flat
     * array of { validationKey, message }. Setting an empty message
     * removes the entry to keep the persisted shape minimal.
     */
    const getErrorMessage = (validationKey: string): string => {
        const errors = (field?.validation?.errors as FieldValidationMetadata[] | undefined) ?? []
        return errors.find((e) => e.validationKey === validationKey)?.message ?? ''
    }

    const setErrorMessage = (validationKey: string, message: string): void => {
        const errors = (field?.validation?.errors as FieldValidationMetadata[] | undefined) ?? []
        const trimmed = message.trim()
        let next: FieldValidationMetadata[]
        if (trimmed) {
            const idx = errors.findIndex((e) => e.validationKey === validationKey)
            if (idx === -1) next = [...errors, { validationKey, message: trimmed }]
            else next = errors.map((e, i) => (i === idx ? { validationKey, message: trimmed } : e))
        } else {
            next = errors.filter((e) => e.validationKey !== validationKey)
        }
        handleValidationKeyChange('errors', next)
    }

    const isValidationActive = (validation: string): boolean => {
        const value = field?.validation?.[validation] ?? field?.[validation]
        return hasValidationValue(value)
    }

    const renderValidationField = (validation: string) => {
        const value = field?.validation?.[validation]

        switch (validation) {
            case 'min':
            case 'max':
            case 'minLength':
            case 'maxLength':
                return (
                    <Input
                        type="number"
                        className="h-8"
                        value={formatValidationInputValue(value)}
                        placeholder={
                            validation === 'min' || validation === 'minLength' ? '>=0' : '>=0'
                        }
                        min={0}
                        onChange={(ev) => {
                            const raw = ev.target.value
                            if (raw === '') {
                                handleValidationKeyChange(validation, undefined)
                                return
                            }
                            const numValue = Number(raw)
                            if (!Number.isNaN(numValue) && numValue >= 0) {
                                handleValidationKeyChange(validation, numValue)
                            }
                        }}
                    />
                )
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
                return (
                    <Input
                        type="number"
                        className="h-8"
                        value={value ?? ''}
                        onChange={(ev) => {
                            const raw = ev.target.value
                            if (raw === '') {
                                handleValidationKeyChange(validation, '' as unknown as number)
                                return
                            }
                            const numValue = Number(raw)
                            if (!Number.isNaN(numValue)) {
                                handleValidationKeyChange(validation, numValue)
                            }
                        }}
                    />
                )
            case 'regex':
                return (
                    <Input
                        className="h-8"
                        value={value || ''}
                        placeholder="/pattern/"
                        onChange={(ev) => handleValidationKeyChange(validation, ev.target.value)}
                    />
                )
            case 'startsWith':
            case 'endsWith':
            case 'includes':
                return (
                    <Input
                        className="h-8"
                        value={value || ''}
                        placeholder={t('enterValue')}
                        onChange={(ev) => handleValidationKeyChange(validation, ev.target.value)}
                    />
                )
            case 'minDate':
            case 'maxDate':
                return (
                    <Input
                        type="date"
                        className="h-8"
                        value={value || ''}
                        onChange={(ev) => handleValidationKeyChange(validation, ev.target.value)}
                    />
                )
            case 'mime':
                return (
                    <Input
                        className="h-8"
                        value={value || ''}
                        placeholder="image/png"
                        onChange={(ev) => handleValidationKeyChange(validation, ev.target.value)}
                    />
                )
            default:
                return (
                    <IGRPSwitch
                        name={validation}
                        checked={value || false}
                        onCheckedChange={(checked) =>
                            handleValidationKeyChange(validation, checked)
                        }
                    />
                )
        }
    }

    const generateZodSchema = () => {
        const validations = getValidationOptions()
        let schema = 'z.'

        // Base type
        if (isFile) {
            schema += 'file()'
        } else if (isString || isEmail) {
            schema += 'string()'
        } else if (isNumber) {
            schema += 'number()'
        } else if (isBoolean) {
            schema += 'boolean()'
        } else if (isDate) {
            schema += 'date()'
        } else {
            schema += 'string()' // default
        }

        // Apply validations
        validations.forEach((validation) => {
            const validationValue = field?.validation?.[validation] ?? field?.[validation]
            if (hasValidationValue(validationValue)) {
                switch (validation) {
                    case 'min':
                    case 'max':
                        if (isFile) {
                            // For file, min/max are in bytes
                            schema += `.${validation}(${validationValue})`
                        } else {
                            schema += `.${validation}(${validationValue})`
                        }
                        break
                    case 'minLength':
                    case 'maxLength':
                        schema += `.${validation}(${validationValue})`
                        break
                    case 'gt':
                    case 'gte':
                    case 'lt':
                    case 'lte':
                        schema += `.${validation}(${validationValue})`
                        break
                    case 'positive':
                        schema += '.positive()'
                        break
                    case 'negative':
                        schema += '.negative()'
                        break
                    case 'int':
                        schema += '.int()'
                        break
                    case 'finite':
                        schema += '.finite()'
                        break
                    case 'email':
                        schema += '.email()'
                        break
                    case 'url':
                        schema += '.url()'
                        break
                    case 'uuid':
                        schema += '.uuid()'
                        break
                    case 'regex':
                        schema += `.regex(/${validationValue}/)`
                        break
                    case 'startsWith':
                        schema += `.startsWith('${validationValue}')`
                        break
                    case 'endsWith':
                        schema += `.endsWith('${validationValue}')`
                        break
                    case 'includes':
                        schema += `.includes('${validationValue}')`
                        break
                    case 'mime':
                        schema += `.mime("${validationValue}")`
                        break
                    case 'minDate':
                    case 'maxDate':
                        schema += `.${validation === 'minDate' ? 'min' : 'max'}(new Date('${validationValue}'))`
                        break
                }
            }
        })

        return schema
    }

    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className="flex items-center" size={'icon'}>
                            <Shield className="w-4 h-4" />
                            <span className="sr-only">{t('validation')}</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                    {t('openValidationSettings')}
                </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-96" align="end" side="bottom">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Tabs defaultValue="validations">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="validations">{t('validations')}</TabsTrigger>
                                <TabsTrigger value="errors">{t('errorMessages')}</TabsTrigger>
                                <TabsTrigger value="zod">Zod Schema</TabsTrigger>
                                <TabsTrigger value="preview">{t('preview')}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="validations" className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('setValidationsForFormField')}
                                </p>

                                <IGRPSeparator orientation="horizontal" />

                                {/* Type-specific validations */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium">
                                        {t('typeSpecificValidations')}
                                    </h4>
                                    <div className="grid gap-3">
                                        {getValidationOptions()
                                            .filter(
                                                (validation) => !['optional'].includes(validation)
                                            )
                                            .filter(shouldShowValidation)
                                            .map((validation) => (
                                                <div
                                                    key={`${validation}-${index}`}
                                                    className="flex items-center gap-4"
                                                >
                                                    <Label
                                                        htmlFor={`${validation}-${index}`}
                                                        className="w-24"
                                                    >
                                                        {toInitCap(t(validation))}
                                                    </Label>
                                                    <div className="flex-1">
                                                        {renderValidationField(validation)}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="errors" className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('errorMessagesHint')}
                                </p>
                                {(() => {
                                    const activeValidations = getValidationOptions()
                                        .filter(shouldShowValidation)
                                        .filter(isValidationActive)
                                    if (activeValidations.length === 0) {
                                        return (
                                            <div className="text-xs text-muted-foreground">
                                                {t('errorMessagesEmpty')}
                                            </div>
                                        )
                                    }
                                    return (
                                        <div className="grid gap-3">
                                            {activeValidations.map((validation) => (
                                                <div
                                                    key={`error-${validation}-${index}`}
                                                    className="flex items-center gap-4"
                                                >
                                                    <Label className="w-24">
                                                        {toInitCap(t(validation))}
                                                    </Label>
                                                    <Input
                                                        className="h-8 flex-1"
                                                        value={getErrorMessage(validation)}
                                                        placeholder={t('errorMessagePlaceholder')}
                                                        onChange={(ev) =>
                                                            setErrorMessage(
                                                                validation,
                                                                ev.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </TabsContent>

                            <TabsContent value="zod" className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('generatedZodSchema')}
                                </p>
                                <div className="bg-muted p-3 rounded-md">
                                    <pre className="text-xs overflow-x-auto">
                                        <code>{generateZodSchema()}</code>
                                    </pre>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generateZodSchema())
                                        }}
                                    >
                                        {t('copyToClipboard')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="preview" className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('validationPreview')}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {t('activeValidations')}:
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {/* Show validation key if present */}
                                        {field?.validation?.key && (
                                            <div className="text-xs text-muted-foreground ml-6">
                                                •{' '}
                                                <span className="font-medium">
                                                    {t('validationKey')}:
                                                </span>{' '}
                                                {field.validation.key}
                                            </div>
                                        )}

                                        {getValidationOptions()
                                            .filter((validation) => {
                                                const value =
                                                    field?.validation?.[validation] ??
                                                    field?.[validation]
                                                return hasValidationValue(value)
                                            })
                                            .map((validation) => {
                                                const value =
                                                    field?.validation?.[validation] ??
                                                    field?.[validation]
                                                return (
                                                    <div
                                                        key={validation}
                                                        className="text-xs text-muted-foreground ml-6"
                                                    >
                                                        • {toInitCap(t(validation))}
                                                        {value !== true &&
                                                            value !== false &&
                                                            `: ${value}`}
                                                    </div>
                                                )
                                            })}
                                        {getValidationOptions().filter((validation) => {
                                            const value =
                                                field?.validation?.[validation] ??
                                                field?.[validation]
                                            return hasValidationValue(value)
                                        }).length === 0 &&
                                            !field?.validation?.key && (
                                                <div className="text-xs text-muted-foreground ml-6">
                                                    {t('noValidationsSet')}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
