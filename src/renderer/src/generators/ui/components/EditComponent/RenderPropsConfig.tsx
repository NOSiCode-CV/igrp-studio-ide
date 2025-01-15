import { Combobox } from "@igrp/igrp-design-system";
import { Checkbox } from "@renderer/components/ui/checkbox";
import { Input } from "@renderer/components/ui/input";
import { Label } from "@renderer/components/ui/label";

const RenderPropsConfig = ({ propsConfig, formValues, handleInputChange }) => {

    return Object.keys(propsConfig).map((key) => {

        const config = propsConfig[key];

        return (

            <div className="space-y-3" key={key}>
                <Label htmlFor={key}>{config.label}</Label>
                {
                    (() => {
                        switch (config.type) {
                            case 'boolean':
                                return (
                                    <Checkbox
                                        name={key}
                                        checked={formValues[key] ?? config.defaultValue}
                                        onChange={handleInputChange}
                                        className="ml-3"
                                    />
                                );
                            case 'select':
                                return (
                                    <Combobox
                                        name={key}
                                        value={formValues[key] ?? config.defaultValue}
                                        onChange={handleInputChange}
                                        options={config.options}
                                        className="w-full"
                                    />
                                );
                            case 'text':
                            default:
                                return (
                                    <Input
                                        type="text"
                                        name={key}
                                        value={formValues[key] ?? config.defaultValue}
                                        onChange={handleInputChange}
                                        className=""
                                    />
                                );
                        }
                    })()
                }
            </div >
        );
    });
};

export default RenderPropsConfig;
