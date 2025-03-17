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
import { ProjectData, SpringConfigData } from 'src/main/types';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { DatabaseOptions } from '@renderer/constants/appConstants';
import useCore from '@renderer/hooks/useCore';
import { useTranslation } from 'react-i18next';
import { FormikErrors } from 'formik';
import { LabelRequired } from '@renderer/components/required';
import { Separator } from '@renderer/components/ui/separator';

interface SpringConfigProps {
    data: SpringConfigData;
    errors?: FormikErrors<ProjectData> | null;
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
    enableEntityRevision: false,
    igrpCoreVersion: '',
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
                    id="apiName"
                    value={data.apiName}
                    onChange={(e) =>
                        onChange({ ...data, apiName: e.target.value })
                    }
                    placeholder={t('enterProjectName')}
                    maxLength={20}
                />
                {errors?.config && errors.config.apiName && (
                    <p className="text-xs text-destructive">
                        {errors.config.apiName}
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
                        onChange={(value) =>
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
                            onChange({ ...data, igrpCoreVersion: value })
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

            <div className="grid grid-cols-2">
                <div className="flex flex-col gap-3">
                    <Label>{t('projectStructureStyle')}</Label>
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
                            <Label htmlFor="technical">{t('technical')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="domain" id="domain" />
                            <Label htmlFor="domain">{t('domainDriven')}</Label>
                        </div>
                    </RadioGroup>
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
                </div>
            </div>
        </div>
    );
}
