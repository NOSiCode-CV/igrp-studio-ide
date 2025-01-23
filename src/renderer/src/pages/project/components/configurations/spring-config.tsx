'use client';

import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import {
    RadioGroup,
    RadioGroupItem,
} from '@renderer/components/ui/radio-group';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Textarea } from '@renderer/components/ui/Textarea';
import { useEffect, useState } from 'react';
import { HandlerResponse, SpringConfigData } from 'src/main/types';
import { Combobox } from '@igrp/igrp-design-system';
import { DatabaseOptions } from '@renderer/constants/appConstants';


interface SpringConfigProps {
    data: SpringConfigData;
    onChange: (data: SpringConfigData) => void;
}

const DEFAULT_SPRING_CONFIG: SpringConfigData = {
    apiName: '',
    description: '',
    group: '',
    artifact: '',
    database: 'Postgresql',
    projectStructureStyle: 'technical',
    enableObservability: false,
    igrpCoreVersion: 'latest',
};

export function SpringConfig({
    data = DEFAULT_SPRING_CONFIG,
    onChange,
}: SpringConfigProps) {
    const [versions, setVersions] = useState([]);

    useEffect(() => {
        const getVersions = async () => {
            const data: HandlerResponse = await window.api.getVersions(import.meta.env.RENDERER_VITE_API_IGRP_VERSIONS );

            const options = data.result.map((value) => {
                return {
                    label: value,
                    value: value,
                };
            });

            setVersions(options);
        };
        getVersions();
    }, []);

    const PackageName = () => {
        return (
            <>
                {data.group && data.artifact && (
                    <p className="w-full text-sm text-muted-foreground italic -mt-2">
                        {`Package Name: ${data.group.replace(/[-\s]/g, '_')}.${data.artifact.replace(/[-\s]/g, '_')}`}
                    </p>
                )}
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="apiName">Name of the project</Label>
                <Input
                    id="apiName"
                    value={data.apiName}
                    onChange={(e) =>
                        onChange({ ...data, apiName: e.target.value })
                    }
                    placeholder="Name of the project"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) =>
                        onChange({ ...data, description: e.target.value })
                    }
                    placeholder="Project description"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="group">Group</Label>
                    <Input
                        id="group"
                        value={data.group}
                        onChange={(e) =>
                            onChange({ ...data, group: e.target.value })
                        }
                        placeholder="com.example"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="artifact">Artifact</Label>
                    <Input
                        id="artifact"
                        value={data.artifact}
                        onChange={(e) =>
                            onChange({ ...data, artifact: e.target.value })
                        }
                        placeholder="my-project"
                    />
                </div>
                <PackageName />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                    <Label>Choose DB Engine</Label>
                    <Combobox
                        name="database"
                        value={data.database}
                        onChange={(value) =>
                            onChange({ ...data, database: value })
                        }
                        options={DatabaseOptions}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2 flex flex-col">
                    <Label>IGRP Core Version</Label>
                    <Combobox
                        options={versions || []}
                        name="igrpCoreVersion"
                        value={data.igrpCoreVersion}
                        onChange={(value) =>
                            onChange({ ...data, igrpCoreVersion: value })
                        }
                        className="w-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2">
                <div className="space-y-3">
                    <Label>Project Structure Style</Label>
                    <RadioGroup
                        value={data.projectStructureStyle}
                        onValueChange={(value) =>
                            onChange({
                                ...data,
                                projectStructureStyle: value as 'technical' | 'domain',
                            })
                        }
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="technical" id="technical" />
                            <Label htmlFor="technical">Technical</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="domain" id="domain" />
                            <Label htmlFor="domain">Domain driven</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="observability"
                        checked={data.enableObservability}
                        onCheckedChange={(checked) =>
                            onChange({
                                ...data,
                                enableObservability: checked as boolean,
                            })
                        }
                    />
                    <Label htmlFor="observability">Enable Observability</Label>
                </div>
            </div>
        </div>
    );
}
