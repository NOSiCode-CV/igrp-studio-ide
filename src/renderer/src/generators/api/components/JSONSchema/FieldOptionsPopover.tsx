import { useState, useEffect } from 'react';
import {
    IGRPPopoverPrimitive,
    IGRPPopoverContentPrimitive,
    IGRPPopoverTriggerPrimitive,
    IGRPSwitchPrimitive,
    IGRPInputPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system';
import { SchemaField } from '../../types/schema';
import { PackageCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    IGRPTabsPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';
import MonacoEditor from '@renderer/components/monaco-editor';

interface FieldOptionsPopoverProps {
    field: SchemaField;
    onUpdate: (updatedField: SchemaField) => void;
}

export function FieldOptionsPopover({
    field,
    onUpdate,
}: FieldOptionsPopoverProps) {
    const { t } = useTranslation();

    const [localField, setLocalField] = useState<SchemaField>(field);

    useEffect(() => {
        setLocalField(field);
    }, [field]);

    const handleChange = (key: keyof SchemaField, value: any) => {
        setLocalField((prev) => ({ ...prev, [key]: value }));
        const updatedField = { ...field, [key]: value };
        onUpdate(updatedField);
    };

    const handleChangeEditor = (_: any) => {};

    return (
        <IGRPPopoverPrimitive>
            <IGRPPopoverTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                    variant="ghost"
                    className="flex items-center h-6 w-6"
                    size={'icon'}
                    title={t('Open advanced settings')}
                >
                    <PackageCheck className="w-4 h-4" /> {/* Settings icon */}
                    <span className="sr-only">{t('Advanced')}</span>
                </IGRPButtonPrimitive>
            </IGRPPopoverTriggerPrimitive>
            <IGRPPopoverContentPrimitive className="w-[425px]">
                <IGRPTabsPrimitive defaultValue="dataType">
                    <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
                        <IGRPTabsTriggerPrimitive value="dataType">
                            {t('Data Type')}
                        </IGRPTabsTriggerPrimitive>
                        <IGRPTabsTriggerPrimitive value="jsonSchema">
                            {t('JSON Schema')}
                        </IGRPTabsTriggerPrimitive>
                    </IGRPTabsListPrimitive>

                    <IGRPTabsContentPrimitive
                        value="dataType"
                        className="space-y-4"
                    >
                        <p className="text-sm text-muted-foreground">
                            {t('configureFieldOptions')}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid grid-cols-3 gap-2 col-span-2">
                                <div className="flex items-center space-x-2">
                                    <IGRPLabelPrimitive
                                        htmlFor="required"
                                        className="text-sm"
                                    >
                                        {t('required')}
                                    </IGRPLabelPrimitive>
                                    <IGRPSwitchPrimitive
                                        id="required"
                                        checked={localField.required || false}
                                        onCheckedChange={(checked) =>
                                            handleChange('required', checked)
                                        }
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <IGRPLabelPrimitive
                                        htmlFor="nullable"
                                        className="text-sm"
                                    >
                                        {t('nullable')}
                                    </IGRPLabelPrimitive>
                                    <IGRPSwitchPrimitive
                                        id="nullable"
                                        checked={localField.nullable || false}
                                        onCheckedChange={(checked) =>
                                            handleChange('nullable', checked)
                                        }
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <IGRPLabelPrimitive
                                        htmlFor="deprecated"
                                        className="text-sm"
                                    >
                                        {t('deprecated')}
                                    </IGRPLabelPrimitive>
                                    <IGRPSwitchPrimitive
                                        id="deprecated"
                                        checked={localField.deprecated || false}
                                        onCheckedChange={(checked) =>
                                            handleChange('deprecated', checked)
                                        }
                                    />
                                </div>
                            </div>
                            <IGRPSeparator className="col-span-2" />
                            {(localField.type === 'string' ||
                                localField.type === 'number' ||
                                localField.type === 'integer') && (
                                <>
                                    <div className="grid grid-cols-3 gap-2 col-span-2">
                                        <div className="items-center space-x-2">
                                            <IGRPLabelPrimitive
                                                htmlFor="enum"
                                                className="text-sm"
                                            >
                                                {t('enum')}
                                            </IGRPLabelPrimitive>
                                            <IGRPSwitchPrimitive
                                                id="enum"
                                                value={
                                                    localField.enum?.join(
                                                        ','
                                                    ) || ''
                                                }
                                                className="h-6 text-sm"
                                                onCheckedChange={(checked) =>
                                                    handleChange(
                                                        'enum',
                                                        checked
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="items-center space-x-2">
                                            <IGRPLabelPrimitive
                                                htmlFor="const"
                                                className="text-sm"
                                            >
                                                {t('const')}
                                            </IGRPLabelPrimitive>
                                            <IGRPSwitchPrimitive
                                                id="const"
                                                value={localField.const || ''}
                                                className="col-span-2 h-6 text-sm"
                                                onCheckedChange={(checked) =>
                                                    handleChange(
                                                        'const',
                                                        checked
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="items-center gap-4">
                                        <IGRPLabelPrimitive
                                            htmlFor="format"
                                            className="text-sm"
                                        >
                                            {t('format')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="format"
                                            value={localField.format || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'format',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="items-center gap-4">
                                        <IGRPLabelPrimitive
                                            htmlFor="default"
                                            className="text-sm"
                                        >
                                            {t('default')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="default"
                                            value={localField.default || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'default',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="items-center gap-4 col-span-2">
                                        <IGRPLabelPrimitive
                                            htmlFor="examples"
                                            className="text-sm"
                                        >
                                            {t('examples')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="examples"
                                            value={
                                                localField.examples?.join(
                                                    ','
                                                ) || ''
                                            }
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'examples',
                                                    e.target.value
                                                        .split(',')
                                                        .map((item) =>
                                                            item.trim()
                                                        )
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                            {(localField.type === 'number' ||
                                localField.type === 'integer') && (
                                <>
                                    <div className="items-center gap-4">
                                        <IGRPLabelPrimitive
                                            htmlFor="minimum"
                                            className="text-sm"
                                        >
                                            {t('minimum')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="minimum"
                                            type="number"
                                            value={localField.minimum || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'minimum',
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="items-center gap-4">
                                        <IGRPLabelPrimitive
                                            htmlFor="maximum"
                                            className="text-sm"
                                        >
                                            {t('maximum')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="maximum"
                                            type="number"
                                            value={localField.maximum || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'maximum',
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="items-center gap-4">
                                        <IGRPLabelPrimitive
                                            htmlFor="multipleOf"
                                            className="text-sm"
                                        >
                                            {t('multipleOf')}
                                        </IGRPLabelPrimitive>
                                        <IGRPInputPrimitive
                                            id="multipleOf"
                                            type="number"
                                            value={localField.multipleOf || ''}
                                            className="col-span-2 h-6 text-sm"
                                            onChange={(e) =>
                                                handleChange(
                                                    'multipleOf',
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                            <div className="col-span-2 items-center gap-4">
                                <IGRPLabelPrimitive className="text-sm">
                                    Title
                                </IGRPLabelPrimitive>
                                <IGRPInputPrimitive
                                    id="title"
                                    value={localField.title || ''}
                                    className=" h-6 text-sm"
                                    onChange={(e) =>
                                        handleChange('title', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </IGRPTabsContentPrimitive>
                    <IGRPTabsContentPrimitive value="jsonSchema">
                        <MonacoEditor
                            content={JSON.stringify(field, null, 2)}
                            onChange={handleChangeEditor}
                        />
                    </IGRPTabsContentPrimitive>
                </IGRPTabsPrimitive>
            </IGRPPopoverContentPrimitive>
        </IGRPPopoverPrimitive>
    );
}
