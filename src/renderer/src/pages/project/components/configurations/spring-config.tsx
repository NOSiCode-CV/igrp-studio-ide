'use client';

import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Textarea } from '@renderer/components/ui/textarea';
import { useEffect, useState } from 'react';
import { SpringConfigData } from 'src/main/types';
import {
    DatabaseOptions,
    projectStructureStyle,
} from '@renderer/constants/appConstants';
import useCore from '@renderer/hooks/use-core';
import { useTranslation } from 'react-i18next';
import { LabelRequired } from '@renderer/components/label-required';
import { Separator } from '@renderer/components/ui/separator';
import { SelectInput } from '@renderer/generators/api/components/inputs-form';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import DependencySelector from '@renderer/components/dependency-selector';

interface SpringConfigProps {
    data: SpringConfigData;
    errors?: any;
    onChange: (data: SpringConfigData) => void;
}

const DEFAULT_SPRING_CONFIG: SpringConfigData = {
    name: '',
    description: '',
    group: 'cv.igrp',
    artifact: '',
    database: 'Postgresql',
    projectStructureStyle: 'technical',
    enableObservability: false,
    enableEntityRevision: false,
    igrpCoreVersion: '',
    springBootVersion: '',
    dependencies: [],
    enableGraalVm: false,
};

export function SpringConfig({
    data = DEFAULT_SPRING_CONFIG,
    errors,
    onChange,
}: SpringConfigProps) {
    const [versions, setVersions] = useState([]);
    const { getVersions } = useCore();
    const { t } = useTranslation(); // Hook for translations

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

    const PackageName = () => {
        return (
            <>
                {data.group && data.artifact && (
                    <p className="w-full text-sm text-muted-foreground italic -mt-2">
                        {t('packageName', {
                            group: data.group.replace(/[-\s]/g, '_'),
                            artifact: data.artifact.replace(/[-\s]/g, '_'),
                        })}
                    </p>
                )}
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3">
                <LabelRequired>{t('projectName')}</LabelRequired>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) =>
                        onChange({ ...data, name: e.target.value })
                    }
                    placeholder={t('enterProjectName')}
                    maxLength={50}
                />
                {errors?.config && errors.config.name && (
                    <p className="text-xs text-destructive">
                        {errors.config.name}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) =>
                        onChange({ ...data, description: e.target.value })
                    }
                    placeholder={t('enterDescription')}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                    <LabelRequired>{t('group')}</LabelRequired>
                    <Input
                        id="group"
                        value={data.group}
                        onChange={(e) =>
                            onChange({ ...data, group: e.target.value })
                        }
                        placeholder={t('enterGroup')}
                        maxLength={20}
                    />
                    {errors?.config && errors.config.group && (
                        <p className="text-xs text-destructive">
                            {errors.config.group}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <LabelRequired>{t('artifact')}</LabelRequired>
                    <Input
                        id="artifact"
                        value={data.artifact}
                        onChange={(e) =>
                            onChange({ ...data, artifact: e.target.value })
                        }
                        placeholder={t('enterArtifact')}
                        maxLength={20}
                    />
                    {errors?.config && errors.config.artifact && (
                        <p className="text-xs text-destructive">
                            {errors.config.artifact}
                        </p>
                    )}
                </div>
                <PackageName />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                    <LabelRequired>{t('chooseDbEngine')}</LabelRequired>
                    <IGRPCombobox
                        value={data.database}
                        onChange={(value: any) =>
                            onChange({ ...data, database: value })
                        }
                        options={DatabaseOptions}
                        className="w-full"
                    />
                    {errors?.config && errors.config.database && (
                        <p className="text-xs text-destructive">
                            {errors.config.database}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <LabelRequired>{t('igrpCoreVersion')}</LabelRequired>
                    <IGRPCombobox
                        options={versions || []}
                        value={data.igrpCoreVersion}
                        onChange={(value) =>
                            onChange({ ...data, igrpCoreVersion: value  as string })
                        }
                        className="w-full"
                    />
                    {errors?.config && errors.config.igrpCoreVersion && (
                        <p className="text-xs text-destructive">
                            {errors.config.igrpCoreVersion}
                        </p>
                    )}
                </div>
            </div>

            <Separator orientation="horizontal" />

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-3">
                    <SelectInput
                        id={'projectStructureStyle'}
                        label={t('projectStructureStyle')}
                        options={projectStructureStyle || []}
                        value={data.projectStructureStyle}
                        onChange={(value) =>
                            onChange({
                                ...data,
                                projectStructureStyle: value as
                                    | 'technical'
                                    | 'domain',
                            })
                        }
                        onBlur={(value) =>
                            onChange({
                                ...data,
                                projectStructureStyle: value as
                                    | 'technical'
                                    | 'domain',
                            })
                        }
                        className="w-full"
                    />
                </div>

                <div className="flex flex-col gap-3">
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
                        <Label htmlFor="observability">
                            {t('enableObservability')}
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="enableEntityRevision"
                            checked={data.enableEntityRevision}
                            onCheckedChange={(checked) =>
                                onChange({
                                    ...data,
                                    enableEntityRevision: checked as boolean,
                                })
                            }
                        />
                        <Label htmlFor="enableEntityRevision">
                            {t('enableEntityRevision')}
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="enableGraalVm"
                            checked={data.enableGraalVm}
                            onCheckedChange={(checked) =>
                                onChange({
                                    ...data,
                                    enableGraalVm: checked as boolean,
                                })
                            }
                        />
                        <Label htmlFor="enableGraalVm">
                            {t('enableGraalVm')}
                        </Label>
                    </div>
                </div>
            </div>

            <Separator orientation="horizontal" />

            <DependencySelector
                onSelectedDependencies={(dependencies) =>
                    onChange({ ...data, dependencies })
                }
            />
        </div>
    );
}
