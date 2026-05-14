import {
    IGRPButtonPrimitive,
    IGRPCombobox,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPPopoverContentPrimitive,
    IGRPPopoverPrimitive,
    IGRPPopoverTriggerPrimitive,
    IGRPSeparator,
    IGRPSwitch,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import MonacoEditor from '@renderer/components/monaco-editor'
import { toInitCap } from '@renderer/utils'
import { PackageCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface PopoverProps {
    row: any
    changeValue: (element: string, value: any) => void
    options: any
}

export function PopoverController({ options, row, changeValue }: PopoverProps) {
    const { t } = useTranslation()

    const [isInteger, setIsInteger] = useState(false)
    const [isBoolean, setIsBoolean] = useState(false)
    const [isConst, setIsConst] = useState(false)
    const [isEnum, setIsEnum] = useState(false)

    const { enumTypes, collectionTypes } = options

    useEffect(() => {
        setIsInteger(row?.['type'] === 'integer' || row?.['type'] === 'long')
        setIsBoolean(row?.['type'] === 'boolean')
    }, [row])

    const changeConst = (key: string, value: boolean): void => {
        setIsConst(key === 'const' && value)
        setIsEnum(key === 'enum' && value)
    }

    return (
        <IGRPPopoverPrimitive>
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPPopoverTriggerPrimitive asChild>
                        <IGRPButtonPrimitive
                            variant="ghost"
                            className="flex items-center"
                            size={'icon'}
                        >
                            <PackageCheck className="w-4 h-4" />
                            <span className="sr-only">{t('advanced')}</span>
                        </IGRPButtonPrimitive>
                    </IGRPPopoverTriggerPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive side="top" align="center">
                    {t('openAdvancedSettings')}
                </IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>
            <IGRPPopoverContentPrimitive className="w-[425px]" align="end" side="bottom">
                <IGRPTabsPrimitive defaultValue="dataType">
                    <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
                        <IGRPTabsTriggerPrimitive value="dataType">
                            {t('dataType')}
                        </IGRPTabsTriggerPrimitive>
                        <IGRPTabsTriggerPrimitive value="jsonSchema">
                            {t('jsonSchema')}
                        </IGRPTabsTriggerPrimitive>
                    </IGRPTabsListPrimitive>

                    <IGRPTabsContentPrimitive value="dataType" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {t('configureFieldOptions')}
                        </p>
                        <div className="flex flex-1 gap-2">
                            {['isRequired', 'nullable', 'deprecated'].map((field: string) => (
                                <div key={`${field}`} className="flex flex-1 items-center gap-4">
                                    <IGRPLabelPrimitive htmlFor={`${field}`}>
                                        {toInitCap(field)}
                                    </IGRPLabelPrimitive>
                                    <IGRPSwitch
                                        name={`${field}`}
                                        id={`${field}`}
                                        onCheckedChange={(checked) => changeValue(field, checked)}
                                        checked={row?.[field] || false}
                                    />
                                </div>
                            ))}
                        </div>
                        <IGRPSeparator orientation="horizontal" />
                        {collectionTypes && collectionTypes.length > 0 && (
                            <div className="flex items-center gap-4">
                                <IGRPLabelPrimitive htmlFor="collectionType">
                                    {t('collectionType')}
                                </IGRPLabelPrimitive>
                                <IGRPCombobox
                                    className="h-8"
                                    value={row?.['collectionType'] || ''}
                                    onChange={(ev) => changeValue('collectionType', ev)}
                                    options={collectionTypes}
                                />
                            </div>
                        )}
                        {!isBoolean && (
                            <div className="flex flex-1 gap-2">
                                {['enum', 'const'].map((field: string) => (
                                    <div key={`${field}`} className="flex items-center gap-4">
                                        <IGRPLabelPrimitive htmlFor={`${field}`}>
                                            {toInitCap(field)}
                                        </IGRPLabelPrimitive>
                                        <IGRPSwitch
                                            name={`${field}`}
                                            id={`${field}`}
                                            onCheckedChange={(checked) =>
                                                changeConst(field, checked)
                                            }
                                            checked={field === 'const' ? isConst : isEnum}
                                        />
                                    </div>
                                ))}
                                {isConst && (
                                    <IGRPInputPrimitive
                                        id="const"
                                        className="h-8"
                                        value={row?.['const'] || ''}
                                        onChange={(ev) => changeValue('const', ev.target.value)}
                                    />
                                )}
                                {isEnum && (
                                    <IGRPCombobox
                                        className="h-8"
                                        value={row?.['enum'] || ''}
                                        onChange={(ev) => changeValue('enum', ev)}
                                        options={enumTypes}
                                    />
                                )}
                            </div>
                        )}
                        {isInteger && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <IGRPLabelPrimitive htmlFor="minimunm">
                                        {t('minimum')}
                                    </IGRPLabelPrimitive>
                                    <IGRPInputPrimitive
                                        id="minimunm"
                                        type={'number'}
                                        className="h-8 w-28"
                                        placeholder=">=0"
                                        value={row?.['minimunm'] || ''}
                                        onChange={(ev) => changeValue('minimunm', ev.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <IGRPLabelPrimitive htmlFor="maximum">
                                        {t('minimum')}
                                    </IGRPLabelPrimitive>
                                    <IGRPInputPrimitive
                                        id="maximum"
                                        type={'number'}
                                        className="h-8 w-28"
                                        placeholder=">=0"
                                        value={row?.['maximum'] || ''}
                                        onChange={(ev) => changeValue('maximum', ev.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <IGRPLabelPrimitive htmlFor="m">
                                        {t('minimum')}
                                    </IGRPLabelPrimitive>
                                    <IGRPInputPrimitive
                                        id="multipleOf"
                                        placeholder=">=0"
                                        type={'multipleOf'}
                                        className="h-8 w-28"
                                        value={row?.['multipleOf'] || ''}
                                        onChange={(ev) =>
                                            changeValue('multipleOf', ev.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            {!isInteger && !isBoolean && (
                                <>
                                    <div className="space-y-1">
                                        <IGRPLabelPrimitive htmlFor="minLength">
                                            {t('minLength')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="minLength"
                                            className="h-8"
                                            value={row?.['minLength'] || ''}
                                            onChange={(ev) =>
                                                changeValue('minLength', ev.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <IGRPLabelPrimitive htmlFor="maxLength">
                                            {t('maxLength')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="maxLength"
                                            className="h-8"
                                            value={row?.['maxLength'] || ''}
                                            onChange={(ev) =>
                                                changeValue('maxLength', ev.target.value)
                                            }
                                        />
                                    </div>
                                </>
                            )}
                            <div className="space-y-1">
                                <IGRPLabelPrimitive htmlFor="default">
                                    {t('default')}
                                </IGRPLabelPrimitive>
                                <IGRPInputPrimitive
                                    id="default"
                                    className="h-8"
                                    value={row?.['default'] || ''}
                                    onChange={(ev) => changeValue('default', ev.target.value)}
                                />
                            </div>
                            {!isBoolean && (
                                <>
                                    <div className="space-y-1">
                                        <IGRPLabelPrimitive htmlFor="regex">
                                            {t('pattern')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="pattern"
                                            className="h-8"
                                            value={row?.['pattern'] || ''}
                                            onChange={(ev) =>
                                                changeValue('pattern', ev.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <IGRPLabelPrimitive htmlFor="examples">
                                            {t('examples')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="examples"
                                            className="h-8"
                                            value={row?.['examples'] || ''}
                                            onChange={(ev) =>
                                                changeValue('examples', ev.target.value)
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </IGRPTabsContentPrimitive>
                    <IGRPTabsContentPrimitive value="jsonSchema">
                        <MonacoEditor
                            content={JSON.stringify(row, null, 2)}
                            filePath=""
                            onChange={() => {}}
                            height="20vh"
                        />
                    </IGRPTabsContentPrimitive>
                </IGRPTabsPrimitive>
            </IGRPPopoverContentPrimitive>
        </IGRPPopoverPrimitive>
    )
}
