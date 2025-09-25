import {
    IGRPButtonPrimitive,
    IGRPInputPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPPopoverPrimitive,
    IGRPPopoverContentPrimitive,
    IGRPPopoverTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTabsPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { PackageCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IGRPSwitch } from '@igrp/igrp-framework-react-design-system';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import { toInitCap } from '@renderer/utils';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import MonacoEditor from '@renderer/components/monaco-editor';

interface PopoverProps {
    row: any;
    changeValue: (element: string, value: any) => void;
    options: any;
}

export function PopoverController({ options, row, changeValue }: PopoverProps) {
    const { t } = useTranslation();

    const [isInteger, setIsInteger] = useState(false);
    const [isBoolean, setIsBoolean] = useState(false);
    const [isConst, setIsConst] = useState(false);
    const [isEnum, setIsEnum] = useState(false);

    const { enumTypes } = options;

    useEffect(() => {
        setIsInteger(row?.['type'] === 'integer' || row?.['type'] === 'long');
        setIsBoolean(row?.['type'] === 'boolean');
    }, [row]);

    const handleChangeEditor = (_value: any) => {};

    const changeConst = (key: string, value: boolean) => {
        setIsConst(key === 'const' && value);
        setIsEnum(key === 'enum' && value);
    };

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
            <IGRPPopoverContentPrimitive
                className="w-[425px]"
                align="end"
                side="bottom"
            >
                <IGRPTabsPrimitive defaultValue="dataType">
                    <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
                        <IGRPTabsTriggerPrimitive value="dataType">
                            {t('dataType')}
                        </IGRPTabsTriggerPrimitive>
                        <IGRPTabsTriggerPrimitive value="jsonSchema">
                            {t('jsonSchema')}
                        </IGRPTabsTriggerPrimitive>
                    </IGRPTabsListPrimitive>

                    <IGRPTabsContentPrimitive
                        value="dataType"
                        className="space-y-4"
                    >
                        <p className="text-sm text-muted-foreground">
                            {t('configureFieldOptions')}
                        </p>
                        <div className="flex flex-1 gap-2">
                            {['isRequired', 'nullable', 'deprecated'].map(
                                (field: string) => (
                                    <div
                                        key={`${field}`}
                                        className="flex flex-1 items-center gap-4"
                                    >
                                        <IGRPLabel htmlFor={`${field}`}>
                                            {toInitCap(field)}
                                        </IGRPLabel>
                                        <IGRPSwitch
                                            name={`${field}`}
                                            id={`${field}`}
                                            onCheckedChange={(checked) =>
                                                changeValue(field, checked)
                                            }
                                            checked={row?.[field] || false}
                                        />
                                    </div>
                                )
                            )}
                        </div>
                        <IGRPSeparator orientation="horizontal" />
                        {!isBoolean && (
                            <div className="flex flex-1 gap-2">
                                {['enum', 'const'].map((field: string) => (
                                    <div
                                        key={`${field}`}
                                        className="flex items-center gap-4"
                                    >
                                        <IGRPLabel htmlFor={`${field}`}>
                                            {toInitCap(field)}
                                        </IGRPLabel>
                                        <IGRPSwitch
                                            name={`${field}`}
                                            id={`${field}`}
                                            onCheckedChange={(checked) =>
                                                changeConst(field, checked)
                                            }
                                            checked={
                                                field === 'const'
                                                    ? isConst
                                                    : isEnum
                                            }
                                        />
                                    </div>
                                ))}
                                {isConst && (
                                    <IGRPInputText
                                        id="const"
                                        className="h-8"
                                        value={row?.['const'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'const',
                                                ev.target.value
                                            )
                                        }
                                    />
                                )}
                                {isEnum && (
                                    <IGRPCombobox
                                        className="h-8"
                                        value={row?.['enum'] || ''}
                                        onChange={(ev) =>
                                            changeValue('enum', ev)
                                        }
                                        options={enumTypes}
                                    />
                                )}
                            </div>
                        )}
                        {isInteger && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <IGRPLabel htmlFor="minimunm">
                                        {t('minimum')}
                                    </IGRPLabel>
                                    <IGRPInputText
                                        id="minimunm"
                                        type={'number'}
                                        className="h-8 w-28"
                                        placeholder=">=0"
                                        value={row?.['minimunm'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'minimunm',
                                                ev.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <IGRPLabel htmlFor="maximum">
                                        {t('minimum')}
                                    </IGRPLabel>
                                    <IGRPInputText
                                        id="maximum"
                                        type={'number'}
                                        className="h-8 w-28"
                                        placeholder=">=0"
                                        value={row?.['maximum'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'maximum',
                                                ev.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <IGRPLabel htmlFor="m">
                                        {t('minimum')}
                                    </IGRPLabel>
                                    <IGRPInputPrimitive
                                        id="multipleOf"
                                        placeholder=">=0"
                                        type={'multipleOf'}
                                        className="h-8 w-28"
                                        value={row?.['multipleOf'] || ''}
                                        onChange={(ev) =>
                                            changeValue(
                                                'multipleOf',
                                                ev.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            {!isInteger && !isBoolean && (
                                <>
                                    <div className="space-y-1">
                                        <IGRPLabel htmlFor="minLength">
                                            {t('minLength')}
                                        </IGRPLabel>
                                        <IGRPInputText
                                            id="minLength"
                                            className="h-8"
                                            value={row?.['minLength'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'minLength',
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <IGRPLabel htmlFor="maxLength">
                                            {t('maxLength')}
                                        </IGRPLabel>
                                        <IGRPInputText
                                            id="maxLength"
                                            className="h-8"
                                            value={row?.['maxLength'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'maxLength',
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                            <div className="space-y-1">
                                <IGRPLabel htmlFor="default">
                                    {t('default')}
                                </IGRPLabel>
                                <IGRPInputText
                                    id="default"
                                    className="h-8"
                                    value={row?.['default'] || ''}
                                    onChange={(ev) =>
                                        changeValue('default', ev.target.value)
                                    }
                                />
                            </div>
                            {!isBoolean && (
                                <>
                                    <div className="space-y-1">
                                        <IGRPLabel htmlFor="regex">
                                            {t('pattern')}
                                        </IGRPLabel>
                                        <IGRPInputText
                                            id="pattern"
                                            className="h-8"
                                            value={row?.['pattern'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'pattern',
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <IGRPLabel htmlFor="examples">
                                            {t('examples')}
                                        </IGRPLabel>
                                        <IGRPInputText
                                            id="examples"
                                            className="h-8"
                                            value={row?.['examples'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'examples',
                                                    ev.target.value
                                                )
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
                            onChange={handleChangeEditor}
                            height="20vh"
                        />
                    </IGRPTabsContentPrimitive>
                </IGRPTabsPrimitive>
            </IGRPPopoverContentPrimitive>
        </IGRPPopoverPrimitive>
    );
}
