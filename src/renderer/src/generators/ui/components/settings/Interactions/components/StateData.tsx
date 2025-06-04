import { Separator } from '@renderer/components/ui/separator';
import { Database } from 'lucide-react';
import { SwitchInput } from '@renderer/generators/api/components/inputs-form';
import { getDefaultProperties } from '@renderer/generators/ui/dnd/helpers';
import { useEffect, useState } from 'react';

interface RulesProps {
    dataProperties: any;
    componentTag: string;
    data: any;
    onDataChange: (data: any) => void;
}
const StateData = ({ dataProperties, data, onDataChange }: RulesProps) => {
    const hasData = !!Object.keys(dataProperties || {}).length;

    const [checkedKeys, setCheckedKeys] = useState<Record<string, boolean>>();

    useEffect(() => {
        const initialChecked = Object.keys(dataProperties).reduce(
            (acc, key) => {
                acc[key] = !!data[key] && Object.keys(data[key]).length > 0;
                return acc;
            },
            {} as Record<string, boolean>
        );

        setCheckedKeys(initialChecked);
    }, [data, dataProperties]);

    const onSave = (checked: boolean, key: string, schemaProperties: any) => {
        setCheckedKeys((prev) => ({ ...prev, [key]: checked }));

        const updatedData = { ...data };

        if (checked) {
            updatedData[key] = getDefaultProperties(schemaProperties);
        } else {
            delete updatedData[key]
        }

        onDataChange(updatedData);
    };

    return (
        <>
            {hasData && (
                <>
                    <Separator />
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                            <Database className="w-4 h-4" />

                            <h3 className="text-sm font-medium flex items-center gap-1">
                                Data Properties (State)
                            </h3>
                        </div>

                        {Object.keys(dataProperties).map(
                            (key: string, index: number) => {
                                const { label, properties } =
                                    dataProperties[key];

                                return (
                                    <div
                                        className="flex items-center justify-between"
                                        key={index}
                                    >
                                        <h3 className="text-sm font-medium  flex items-center gap-1">
                                            {label}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            <SwitchInput
                                                value={
                                                    checkedKeys?.[key] || false
                                                }
                                                onChange={(checked) =>
                                                    onSave(
                                                        checked,
                                                        key,
                                                        properties
                                                    )
                                                }
                                                id={key}
                                                label="Generate"
                                            />
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </>
            )}
        </>
    );
};

export default StateData;
