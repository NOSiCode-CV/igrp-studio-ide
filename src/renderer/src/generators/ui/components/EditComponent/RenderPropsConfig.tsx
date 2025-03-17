import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Switch } from '@renderer/components/ui/switch';
import { getLabel } from '@renderer/utils/helpers';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { useState } from 'react';

const RenderPropsConfig = ({ propsComp, formValues, handleInputChange }) => {
    const [collapsed, setCollapsed] = useState({});

    const toggleCollapse = (key) => {
        setCollapsed((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const renderField = (key, fieldConfig, parentKey = '') => {
        const { enum: enumValues, type: typeValue } = fieldConfig;
        const label = getLabel(key);
        const type = enumValues ? 'enum' : typeValue;
        const value = formValues[parentKey ? `${parentKey}.${key}` : key] || '';

        if (key === 'commonProperties') {
            return (
                <div className="flex flex-col gap-2" key={key}>
                    <button
                        type="button"
                        onClick={() => toggleCollapse(key)}
                        className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-md"
                    >
                        <Label htmlFor={key}>{label}</Label>
                        <span>
                            {collapsed[key] ? <ChevronDown className='h-4 w-4'/> : <ChevronUp className='h-4 w-4'/>}
                        </span>
                    </button>
                    {!collapsed[key] && (
                        <div className="space-y-3">
                            {Object.keys(fieldConfig).map((nestedKey) =>
                                renderField(
                                    nestedKey,
                                    fieldConfig[nestedKey],
                                    parentKey ? `${parentKey}.${key}` : key
                                )
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                {(() => {
                    switch (type) {
                        case 'boolean':
                            return (
                                <Switch
                                    name={key}
                                    checked={value}
                                    onChange={(checked) =>
                                        handleInputChange(
                                            parentKey
                                                ? `${parentKey}.${key}`
                                                : key,
                                            checked
                                        )
                                    }
                                />
                            );
                        case 'enum':
                            return (
                                <IGRPCombobox
                                    value={value}
                                    onChange={(value) =>
                                        handleInputChange(
                                            parentKey
                                                ? `${parentKey}.${key}`
                                                : key,
                                            value
                                        )
                                    }
                                    options={enumValues.map((value) => ({
                                        value,
                                        label: getLabel(value),
                                    }))}
                                    className="w-full"
                                />
                            );
                        case 'string':
                            return (
                                <Input
                                    type="text"
                                    name={key}
                                    value={value}
                                    onChange={(e) =>
                                        handleInputChange(
                                            parentKey
                                                ? `${parentKey}.${key}`
                                                : key,
                                            e.target.value
                                        )
                                    }
                                />
                            );
                        case 'number':
                            return (
                                <Input
                                    type="number"
                                    name={key}
                                    value={value}
                                    onChange={(e) =>
                                        handleInputChange(
                                            parentKey
                                                ? `${parentKey}.${key}`
                                                : key,
                                            e.target.value
                                        )
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
            {Object.keys(propsComp).map((key) =>
                renderField(key, propsComp[key])
            )}
        </div>
    );
};

export default RenderPropsConfig;
