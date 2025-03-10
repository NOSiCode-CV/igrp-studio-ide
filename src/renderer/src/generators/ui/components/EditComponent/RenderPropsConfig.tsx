import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Switch } from '@renderer/components/ui/switch';

function getLabel(name: string) {
    return name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

const RenderPropsConfig = ({ propsComp, formValues, handleInputChange }) => {
    return (
        <div className="space-y-3">
            {Object.keys(propsComp).map((key) => {
                const { enum: enumValues, type: typeValue } = propsComp[key];
                const label = getLabel(key);
                const type = enumValues ? 'enum' : typeValue;
                return (
                    <div className="flex flex-col gap-2 space-x-2" key={key}>
                        <Label htmlFor={key}>{label}</Label>
                        {(() => {
                            switch (type) {
                                case 'boolean':
                                    return (
                                        <Switch
                                            name={key}
                                            checked={formValues[key]}
                                            onChange={(checked) =>
                                                handleInputChange(key, checked)
                                            }
                                        />
                                    );
                                case 'enum':
                                    return (
                                        <IGRPCombobox
                                            value={formValues[key]}
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
                                            value={formValues[key]}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    key,
                                                    e.target.value
                                                )
                                            }
                                            className=""
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
