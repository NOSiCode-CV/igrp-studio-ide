import {
    IGRPCombobox,
    IGRPPopoverTriggerPrimitive,
    IGRPSwitchPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPPopoverPrimitive,
    IGRPPopoverContentPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTabsPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toInitCap } from '@renderer/utils';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { PackageCheck } from 'lucide-react';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';

interface PopoverDtoProps {
    children?: ReactNode;
    index: number;
    row: any;
    collectionTypes: any[];
    changeValue: (element: string, position: number, value: any) => void;
}

export function PopoverDto({
    index,
    row,
    collectionTypes,
    changeValue,
}: PopoverDtoProps) {
    const { t } = useTranslation();

    const [isInteger, setIsInteger] = useState(false);
    const [isBoolean, setIsBoolean] = useState(false);

    useEffect(() => {
        setIsInteger(
            row?.['type'] === 'integer' ||
                row?.['type'] === 'long' ||
                row?.['type'] === 'biginteger' ||
                row?.['type'] === 'double'
        );
        setIsBoolean(row?.['type'] === 'boolean');
    }, [row]);

    const shouldShowField = (field: string) => {
        if (field === 'positive') {
            return isInteger; // Show "positive" only for integer types
        }
        if (field === 'isEmail' || field === 'isUrl') {
            return !isBoolean && !isInteger;
        }
        return true;
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
                className="w-100"
                align="end"
                side="bottom"
            >
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <IGRPTabsPrimitive defaultValue="validations">
                            <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
                                <IGRPTabsTriggerPrimitive value="validations">
                                    {t('validations')}
                                </IGRPTabsTriggerPrimitive>
                                <IGRPTabsTriggerPrimitive value="others">
                                    {t('others')}
                                </IGRPTabsTriggerPrimitive>
                            </IGRPTabsListPrimitive>

                            <IGRPTabsContentPrimitive
                                value="validations"
                                className="space-y-4"
                            >
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('setValidationsForDataObjects')}
                                </p>
                                <div className="flex flex-1 gap-2">
                                    {['required', 'before', 'after'].map(
                                        (field) => (
                                            <div
                                                key={`${field}-${index}`}
                                                className="flex flex-1 items-center gap-4"
                                            >
                                                <IGRPLabelPrimitive
                                                    htmlFor={`${field}-${index}`}
                                                >
                                                    {toInitCap(t(field))}
                                                </IGRPLabelPrimitive>
                                                <IGRPSwitchPrimitive
                                                    id={`${field}-${index}`}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        changeValue(
                                                            field,
                                                            index,
                                                            checked
                                                        )
                                                    }
                                                    checked={
                                                        row?.[field] || false
                                                    }
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                                <IGRPSeparator orientation="horizontal" />
                                <div className="flex flex-1 gap-2">
                                    {['positive', 'isEmail', 'isUrl']
                                        .filter((field) =>
                                            shouldShowField(field)
                                        )
                                        .map((field) => (
                                            <div
                                                key={`${field}-${index}`}
                                                className="flex flex-1 items-center gap-4"
                                            >
                                                <IGRPLabelPrimitive
                                                    htmlFor={`${field}-${index}`}
                                                >
                                                    {toInitCap(t(field))}
                                                </IGRPLabelPrimitive>
                                                <IGRPSwitchPrimitive
                                                    id={`${field}-${index}`}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        changeValue(
                                                            field,
                                                            index,
                                                            checked
                                                        )
                                                    }
                                                    checked={
                                                        row?.[field] || false
                                                    }
                                                />
                                            </div>
                                        ))}
                                </div>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="space-y-2">
                                        <IGRPLabelPrimitive htmlFor="minLength">
                                            {t('minLength')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="minLength"
                                            type="number"
                                            className="h-8"
                                            value={row?.['minLength'] || ''}
                                            placeholder=">=0"
                                            min={1}
                                            onChange={(ev) => {
                                                const value = Number(
                                                    ev.target.value
                                                );
                                                if (value >= 0) {
                                                    changeValue(
                                                        'minLength',
                                                        index,
                                                        value
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IGRPLabelPrimitive htmlFor="maxLength">
                                            {t('maxLength')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="maxLength"
                                            type="number"
                                            className="h-8"
                                            value={row?.['maxLength'] || ''}
                                            placeholder=">=0"
                                            onChange={(ev) => {
                                                const value = Number(
                                                    ev.target.value
                                                );
                                                if (value >= 0) {
                                                    changeValue(
                                                        'maxLength',
                                                        index,
                                                        value
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IGRPLabelPrimitive htmlFor="regex">
                                            {t('regex')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="regex"
                                            className="col-span-2 h-8"
                                            value={row?.['regex'] || ''}
                                            onChange={(ev) =>
                                                changeValue(
                                                    'regex',
                                                    index,
                                                    ev.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </IGRPTabsContentPrimitive>
                            <IGRPTabsContentPrimitive
                                value="others"
                                className="space-y-4"
                            >
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t('setOtherSettingsForDataObjects')}
                                </p>
                                {['primaryKey'].map((field) => (
                                    <div
                                        key={`${field}-${index}`}
                                        className="flex flex-1 items-center gap-4"
                                    >
                                        <IGRPLabelPrimitive
                                            htmlFor={`${field}-${index}`}
                                        >
                                            {t('identifier')}
                                        </IGRPLabelPrimitive>
                                        <IGRPSwitchPrimitive
                                            id={`${field}-${index}`}
                                            onCheckedChange={(checked) =>
                                                changeValue(
                                                    field,
                                                    index,
                                                    checked
                                                )
                                            }
                                            checked={row?.[field] || false}
                                        />
                                    </div>
                                ))}
                                <IGRPSeparator orientation="horizontal" />
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="space-y-2 flex flex-col">
                                        <IGRPLabelPrimitive htmlFor="collectionType">
                                            {t('collectionType')}
                                        </IGRPLabelPrimitive>
                                        <IGRPCombobox
                                            key={`${index}`}
                                            placeholder={t(
                                                'selectCollectionType'
                                            )}
                                            options={collectionTypes}
                                            value={
                                                row?.['collectionType'] || ''
                                            }
                                            onChange={(selectedOption) => {
                                                changeValue(
                                                    'collectionType',
                                                    index,
                                                    selectedOption
                                                );
                                            }}
                                        />
                                    </div>
                                </div>
                            </IGRPTabsContentPrimitive>
                        </IGRPTabsPrimitive>
                    </div>
                </div>
            </IGRPPopoverContentPrimitive>
        </IGRPPopoverPrimitive>
    );
}
