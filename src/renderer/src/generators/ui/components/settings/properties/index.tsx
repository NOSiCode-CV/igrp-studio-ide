import {
    IGRPCombobox,
    IGRPDatePicker,
} from '@igrp/igrp-framework-react-design-system';
import DynamicKeyValueForm from '@renderer/components/domain-form';
import IconBrowser from '@renderer/components/icon/icon-browser';
import MultipleSelector from '@renderer/components/multiples-selector';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@renderer/components/ui/accordion';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Switch } from '@renderer/components/ui/switch';
import { cn } from '@renderer/lib/utils';
import { getLabel } from '@renderer/utils';

import React from 'react';

const toMap = (items: any) => {
    return (
        items &&
        items.map((value: string) => ({
            value,
            label: value,
        }))
    );
};

const getNestedValue = (obj: any, path: string) => {
    return path
        .split('.')
        .reduce(
            (acc, key) =>
                acc && acc[key] !== undefined ? acc[key] : undefined,
            obj
        );
};

const RenderPropsConfig = ({ propsComp, formValues, handleInputChange }) => {

    const renderField = (key: string, fieldConfig: any, parentKey?: string) => {
        const { enum: enumValues, type: typeDefault, items } = fieldConfig;
        const label = getLabel(key);
        const type = enumValues ? 'enum' : typeDefault;

        const fieldPath = parentKey ? `${parentKey}.${key}` : key;

        const value = getNestedValue(formValues, fieldPath);

        if (fieldConfig.type === 'object' && fieldConfig.properties) {
            const props = fieldConfig.properties;
            return (
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem key={key} value={key}>
                        <AccordionTrigger>{label}</AccordionTrigger>
                        <AccordionContent className="space-y-3">
                            {Object.keys(props).map((nestedKey) =>
                                renderField(nestedKey, props[nestedKey], parentKey ? `${parentKey}.${key}` : key)
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        } else if (key === 'iconName') {
            return (
                <IconBrowser
                    selectedIcon={value}
                    onSelectedIcon={(icon: string) => {
                        handleInputChange(fieldPath, icon);
                    }}
                />
            );
        } else if (key === 'options') {
            return (
                <DynamicKeyValueForm
                    onAdd={(opt) => {
                        handleInputChange(fieldPath, opt);
                    }}
                />
            );
        }

        return (
            <div
                className={cn(
                    type === 'boolean' &&
                    'flex flex-1 space-x-3 align-middle justify-between space-y-2',
                    type !== 'boolean' && 'flex flex-col space-y-2'
                )}
                key={key}
            >
                <Label htmlFor={key}>{label}</Label>
                {(() => {
                    switch (type) {
                        case 'boolean':
                            return (
                                <Switch
                                    id={parentKey ? `${parentKey}.${key}` : key}
                                    name={key}
                                    checked={value}
                                    onCheckedChange={(checked) => {
                                        handleInputChange(fieldPath, checked);
                                    }}
                                />
                            );
                        case 'enum':
                            return (
                                <IGRPCombobox
                                    value={value}
                                    onChange={(value) =>
                                        handleInputChange(fieldPath, value)
                                    }
                                    options={toMap(enumValues)}
                                    className="w-full"
                                />
                            );
                        case 'string':
                        case 'any':
                            return (
                                <Input
                                    id={parentKey ? `${parentKey}.${key}` : key}
                                    type="text"
                                    name={key}
                                    value={value}
                                    onChange={(e) =>
                                        handleInputChange(
                                            fieldPath,
                                            e.target.value
                                        )
                                    }
                                />
                            );
                        case 'number':
                            return (
                                <Input
                                    id={parentKey ? `${parentKey}.${key}` : key}
                                    type="number"
                                    name={key}
                                    value={value}
                                    onChange={(e) =>
                                        handleInputChange(
                                            fieldPath,
                                            e.target.value
                                        )
                                    }
                                />
                            );
                        case 'date':
                            return (
                                <IGRPDatePicker
                                    name={
                                        parentKey ? `${parentKey}.${key}` : key
                                    }
                                    date={value}
                                    onDateChange={(value) =>
                                        handleInputChange(fieldPath, value)
                                    }
                                    className=""
                                    id={parentKey ? `${parentKey}.${key}` : key}
                                />
                            );
                        case 'array':
                            return (
                                <MultipleSelector
                                    value={value}
                                    onChange={(value) =>
                                        handleInputChange(fieldPath, value)
                                    }
                                    options={toMap(items?.enum)}
                                />
                            );

                        default:
                            return null;
                    }
                })()}
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {Object.keys(propsComp).map((key, index) => {
                return (
                    <React.Fragment key={index}>
                        {renderField(key, propsComp[key])}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default RenderPropsConfig;
