import { IGRPButtonPrimitive, IGRPPopoverContentPrimitive, IGRPPopoverTriggerPrimitive, IGRPSeparatorPrimitive, IGRPSwitchPrimitive, IGRPTooltipContentPrimitive, IGRPTooltipPrimitive, IGRPTooltipTriggerPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPPopoverPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTabsPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { PackageCheck } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';

interface PopoverProps {
    children?: ReactNode;
    index: number;
    row: any;
    options: any;
    changeValue: (element: string, position: number, value: any) => void;
}

export function PopoverModel({
    index,
    row,
    options,
    changeValue,
}: PopoverProps) {
    const { t } = useTranslation();

    const [isPrimary, setIsPrimary] = useState(false);

    useEffect(() => {
        setIsPrimary(row?.['primaryKey'] === true);
    }, [row]);

    return (
        <IGRPPopoverPrimitive>
            <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive     asChild>
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
            <IGRPPopoverContentPrimitive className="w-100" align="end" side="bottom">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <IGRPTabsPrimitive defaultValue="dataType">
                            <IGRPTabsListPrimitive    className="grid w-full grid-cols-1">
                                <IGRPTabsTriggerPrimitive value="dataType">
                                    {t('settings')}
                                </IGRPTabsTriggerPrimitive>
                            </IGRPTabsListPrimitive>

                            <IGRPTabsContentPrimitive value="dataType" className="space-y-4">
                                <div className="flex flex-1 gap-2">
                                    {['unique', 'nullable', 'primaryKey'].map(
                                        (field) => (
                                            <div
                                                key={`${field}-${index}`}
                                                className="flex flex-1 items-center gap-4"
                                            >
                                                <IGRPLabel
                                                    htmlFor={`${field}-${index}`}
                                                >
                                                    {t(field)}
                                                </IGRPLabel>
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
                                {options.revision && (
                                    <>
                                        <IGRPSeparator orientation="horizontal" />

                                        <div className="flex flex-1 gap-2">
                                            <div className="flex flex-1 items-center gap-4">
                                                <IGRPLabel
                                                    htmlFor={`skipFieldRevision`}
                                                >
                                                    {t('skipFieldRevision')}
                                                </IGRPLabel>
                                                <IGRPSwitchPrimitive
                                                    id={`skipFieldRevision-${index}`}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        changeValue(
                                                            'skipFieldRevision',
                                                            index,
                                                            checked
                                                        )
                                                    }
                                                    checked={
                                                        row?.[
                                                            'skipFieldRevision'
                                                        ] || false
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <IGRPSeparatorPrimitive orientation="horizontal" />
                                <div className="grid grid-cols-2 gap-2">
                                    <>
                                        {isPrimary && (
                                            <div className="space-y-2 col-span-2 flex flex-col">
                                                <IGRPLabel htmlFor="generationType">
                                                    {t('generationType')}
                                                </IGRPLabel>
                                                <IGRPCombobox
                                                    placeholder={`Select Generation Type`}
                                                    options={
                                                        options.generateTypes
                                                    }
                                                    value={
                                                        row?.[
                                                            'generationType'
                                                        ] || 'IDENTITY'
                                                    }
                                                    onChange={(value) =>
                                                        changeValue(
                                                            'generationType',
                                                            index,
                                                            value
                                                        )
                                                    }
                                                    className="w-full h-8"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <IGRPLabel htmlFor="length">
                                                {t('length')}
                                            </IGRPLabel>
                                            <IGRPInputText
                                                id="length"
                                                className="h-8"
                                                value={row?.['length'] || ''}
                                                onChange={(ev) =>
                                                    changeValue(
                                                        'length',
                                                        index,
                                                        ev.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <IGRPLabel htmlFor="defaultValue">
                                                {t('defaultValue')}
                                            </IGRPLabel>
                                            <IGRPInputText
                                                id="defaultValue"
                                                className="h-8"
                                                value={
                                                    row?.['defaultValue'] || ''
                                                }
                                                onChange={(ev) =>
                                                    changeValue(
                                                        'defaultValue',
                                                        index,
                                                        ev.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </>
                                </div>
                            </IGRPTabsContentPrimitive>
                        </IGRPTabsPrimitive>
                    </div>
                </div>
            </IGRPPopoverContentPrimitive>
        </IGRPPopoverPrimitive>
    );
}
