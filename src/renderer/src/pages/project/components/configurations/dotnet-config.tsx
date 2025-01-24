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
import { HandlerResponse, DotNetConfigData } from 'src/main/types';
import { Combobox } from '@igrp/igrp-design-system';
import { DatabaseOptions } from '@renderer/constants/appConstants';
import useCore from '@renderer/hooks/useCore';

interface DotNetConfigProps {
    data: DotNetConfigData;
    onChange: (data: DotNetConfigData) => void;
}

const DEFAULT_SPRING_CONFIG: DotNetConfigData = {
    apiName: '',
    description: '',
    artifact: '',
    database: 'postgresql',
    projectStructureStyle: 'technical',
    enableObservability: false,
    igrpCoreVersion: 'latest',
};

export function DotNetConfig({
    data = DEFAULT_SPRING_CONFIG,
    onChange,
}: DotNetConfigProps) {
    const [versions, setVersions] = useState([]);
    const { getVersions } = useCore();

    useEffect(() => {
        const fetchVersions = async () => {
            const versionsData = await getVersions();
            setVersions(versionsData);

            if (versionsData.length > 0) {
                const latestVersion = versionsData[0]?.value;
                if (!data.igrpCoreVersion) {
                    onChange({ ...data, igrpCoreVersion: latestVersion });
                }
            }
        };

        fetchVersions();
    }, [getVersions]);

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
                                projectStructureStyle: value as
                                    | 'technical'
                                    | 'domain',
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
                            <Label htmlFor="domain">Domain</Label>
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
