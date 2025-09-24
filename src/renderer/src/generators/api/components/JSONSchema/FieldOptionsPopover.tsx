import { useState, useEffect } from 'react';
import {
    IGRPPopoverPrimitive,
    IGRPPopoverContentPrimitive,
    IGRPPopoverTriggerPrimitive,
    IGRPSwitchPrimitive,
    IGRPInputPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
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
		const updatedField = { ...field, [key]: value  };
        onUpdate(updatedField);
    };

    const handleChangeEditor = (_: any)=>{

    }

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

                    <IGRPTabsContentPrimitive value="dataType" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                             {t('configureFieldOptions')}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid grid-cols-3 gap-2 col-span-2">
                                <div className="flex items-center space-x-2">
                                    <IGRPLabel
                                        htmlFor="required"
                                        className="text-sm"
                                    >
                                        {t('required')}
                                    </IGRPLabel>
                                    <IGRPSwitchPrimitive 
                                        id="required"
                                        checked={localField.required || false}
                                        onCheckedChange={(checked) =>
                                            handleChange('required', checked)
                                        }
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <IGRPLabel
                                        htmlFor="nullable"
                                        className="text-sm"
                                    >
                                        {t('nullable')}
                                    </IGRPLabel>
                                    <IGRPSwitchPrimitive
                                        id="nullable"
                                        checked={localField.nullable || false}
                                        onCheckedChange={(checked) =>
                                            handleChange('nullable', checked)
                                        }
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <IGRPLabel
                                        htmlFor="deprecated"
                                        className="text-sm"
                                    >
                                        {t('deprecated')}
                                    </IGRPLabel>
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
                                            <IGRPLabel
                                                htmlFor="enum"
                                                className="text-sm"
                                            >
                                                {t('enum')}
                                            </IGRPLabel>
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
                                            <IGRPLabel
                                                htmlFor="const"
                                                className="text-sm"
                                            >
                                                {t('const')}
                                            </IGRPLabel>
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
                                        <IGRPLabel
                                            htmlFor="format"
                                            className="text-sm"
                                        >
                                            {t('format')}
                                        </IGRPLabel>
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
                                        <IGRPLabel
                                            htmlFor="default"
                                            className="text-sm"
                                        >
                                            {t('default')}
                                        </IGRPLabel>
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
                                        <IGRPLabel
                                            htmlFor="examples"
                                            className="text-sm"
                                        >
                                            {t('examples')}
                                        </IGRPLabel>
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
                                        <IGRPLabel
                                            htmlFor="minimum"
                                            className="text-sm"
                                        >
                                            {t('minimum')}
                                        </IGRPLabel>
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
                                        <IGRPLabel
                                            htmlFor="maximum"
                                            className="text-sm"
                                        >
                                            {t('maximum')}
                                        </IGRPLabel>
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
                                        <IGRPLabel
                                            htmlFor="multipleOf"
                                            className="text-sm"
                                        >
                                            {t('multipleOf')}
                                        </IGRPLabel>
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
                                <IGRPLabel htmlFor="title" className="text-sm">
                                    Title
                                </IGRPLabel>
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
