'use client';

import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';
import {
    RadioGroup,
    RadioGroupItem,
} from '@renderer/components/ui/radio-group';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Textarea } from '@renderer/components/ui/textarea';
import { useEffect, useState } from 'react';
import { DotNetConfigData, ProjectData } from 'src/main/types';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { DatabaseOptions } from '@renderer/constants/appConstants';
import useCore from '@renderer/hooks/use-core';
import { useTranslation } from 'react-i18next';
import { FormikErrors } from 'formik';
import { LabelRequired } from '@renderer/components/label-required';

interface DotNetConfigProps {
    data: DotNetConfigData;
    errors?: FormikErrors<ProjectData>;
    onChange: (data: DotNetConfigData) => void;
}

const DEFAULT_DOTNET_CONFIG: DotNetConfigData = {
    name: '',
    description: '',
    artifact: '',
    database: 'Postgresql',
    projectStructureStyle: 'technical',
    enableObservability: false,
    igrpCoreVersion: '',
};

export function DotNetConfig({
    data = DEFAULT_DOTNET_CONFIG,
    onChange,
}: DotNetConfigProps) {
    const [versions, setVersions] = useState([]);
    const { getVersions } = useCore();
    const { t } = useTranslation();

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
                <LabelRequired>{t('projectName')}</LabelRequired>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) =>
                        onChange({ ...data, name: e.target.value })
                    }
                    placeholder={t('enterProjectName')}
                    maxLength={20}
                />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                    <LabelRequired>{t('chooseDbEngine')}</LabelRequired>
                    <IGRPCombobox
                        value={data.database}
                        onChange={(value) =>
                            onChange({ ...data, database: value })
                        }
                        options={DatabaseOptions}
                        className="w-full"
                    />
                </div>
                <div className="space-y-2 flex flex-col">
                    <LabelRequired>{t('igrpCoreVersion')}</LabelRequired>
                    <IGRPCombobox
                        options={versions || []}
                        value={data.igrpCoreVersion}
                        onChange={(value) =>
                            onChange({ ...data, igrpCoreVersion: value as string})
                        }
                        className="w-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2">
                <div className="space-y-3">
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
            </div>
        </div>
    );
}
