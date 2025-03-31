import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import DomainForm from '@renderer/components/domain-form';
import IconBrowser from '@renderer/components/icon/icon-browser';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';
import { Switch } from '@renderer/components/ui/switch';
import { cn } from '@renderer/lib/utils';
import {
    getLabel,
    toFullCamelCaseFromSnakeCase,
} from '@renderer/utils/helpers';
import { ChevronDown, ChevronUp } from 'lucide-react';

import React, { useState } from 'react';

const RenderPropsConfig = ({ propsComp, formValues, handleInputChange }) => {
    const [collapsed, setCollapsed] = useState({});

    const toggleCollapse = (key) => {
        setCollapsed((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const renderField = (key: string, fieldConfig: any, parentKey?: string) => {
        const { enum: enumValues, type: typeDefault } = fieldConfig;
        const label = getLabel(key);
        const type = enumValues ? 'enum' : typeDefault;
        const value = formValues[key];

        if (key === 'commonProperties' || key === 'iconProperties') {
            return (
                <>
                    <div className="flex flex-col gap-2" key={key}>
                        <button
                            type="button"
                            onClick={() => toggleCollapse(key)}
                            className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-md"
                        >
                            <Label htmlFor={key}>{label}</Label>
                            <span>
                                {collapsed[key] ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4" />
                                )}
                            </span>
                        </button>
                        {collapsed[key] && (
                            <>
                                <div className="space-y-3">
                                    {Object.keys(fieldConfig).map((nestedKey) =>
                                        renderField(
                                            nestedKey,
                                            fieldConfig[nestedKey],
                                            parentKey
                                                ? `${parentKey}.${key}`
                                                : key
                                        )
                                    )}
                                </div>

                                <Separator />
                            </>
                        )}
                    </div>
                </>
            );
        } else if (key === 'iconName') {
            return (
                <IconBrowser
                    selectedIcon={value}
                    onSelectedIcon={(icon: string) => {
                        handleInputChange(key, icon);
                    }}
                />
            );
        } else if (key === 'options') {
            return <DomainForm />;
        }
        return (
            <div
                className={cn(
                    type === 'boolean' && 'flex flex-1 space-x-3 align-middle',
                    type !== 'boolean' && 'flex flex-col gap-2'
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
                                    checked={value || false}
                                    onCheckedChange={(checked) => {
                                        handleInputChange(key, checked);
                                    }}
                                />
                            );
                        case 'enum':
                            return (
                                <IGRPCombobox
                                    value={value}
                                    onChange={(value) =>
                                        handleInputChange(key, value)
                                    }
                                    options={enumValues.map((value) => ({
                                        value,
                                        label: toFullCamelCaseFromSnakeCase(
                                            value
                                        ),
                                    }))}
                                    className="w-full"
                                />
                            );
                        case 'string':
                            return (
                                <Input
                                    id={parentKey ? `${parentKey}.${key}` : key}
                                    type="text"
                                    name={key}
                                    value={value}
                                    onChange={(e) =>
                                        handleInputChange(key, e.target.value)
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
                                        handleInputChange(key, e.target.value)
                                    }
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
