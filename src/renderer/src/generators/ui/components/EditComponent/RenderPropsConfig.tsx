import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Switch } from '@renderer/components/ui/switch';

function getLabel(name: string): string {
    if (!name) return ''; // Handle empty string

    // Split on hyphens or uppercase letters
    const parts = name
        .replace(/([A-Z])/g, ' $1') // Add a space before uppercase letters
        .split(/[- ]+/); // Split on hyphens or spaces

    // Capitalize the first letter of each part and join with spaces
    return parts
        .filter((part) => part.length > 0) // Remove empty parts
        .map(
            (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join(' ');
}

const RenderPropsConfig = ({ propsComp, formValues, handleInputChange }) => {
    return (
        <div className="space-y-3">
            {Object.keys(propsComp).map((key) => {
                const { enum: enumValues, type: typeValue } = propsComp[key];
                const label = getLabel(key);
                const type = enumValues ? 'enum' : typeValue;
                const value = formValues[key] || '';
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
                                                handleInputChange(key, checked)
                                            }
                                        />
                                    );
                                case 'enum':
                                    return (
                                        <IGRPCombobox
                                            value={value}
                                            onChange={(value) =>
                                                handleInputChange(key, value)
                                            }
                                            options={enumValues.map(
                                                (value: string) => ({
                                                    value,
                                                    label: getLabel(value),
                                                })
                                            )}
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
                                                    key,
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
                                                    key,
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
            })}
        </div>
    );
};

export default RenderPropsConfig;
