'use client';

import {
    IGRPCheckboxPrimitive,
    IGRPInputPrimitive,
    IGRPLabel,
    IGRPRadioGroupItemPrimitive,
    IGRPRadioGroupPrimitive,
    IGRPTextAreaPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import { DotNetConfigData, ProjectData } from 'src/main/types';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { DatabaseOptions } from '@renderer/constants/appConstants';
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
    version: '',
};

export function DotNetConfig({
    data = DEFAULT_DOTNET_CONFIG,
    onChange,
}: DotNetConfigProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <LabelRequired>{t('projectName')}</LabelRequired>
                <IGRPInputText
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
                <IGRPLabel htmlFor="description">{t('description')}</IGRPLabel>
                <IGRPTextAreaPrimitive
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
                <IGRPInputPrimitive
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
            </div>

            <div className="grid grid-cols-2">
                <div className="space-y-3">
                    <IGRPLabel>{t('projectStructureStyle')}</IGRPLabel>
                    <IGRPRadioGroupPrimitive
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
                            <IGRPRadioGroupItemPrimitive
                                value="technical"
                                id="technical"
                            />
                            <IGRPLabel htmlFor="technical">
                                {t('technical')}
                            </IGRPLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                            <IGRPRadioGroupItemPrimitive
                                value="domain"
                                id="domain"
                            />
                            <IGRPLabel htmlFor="domain">
                                {t('domainDriven')}
                            </IGRPLabel>
                        </div>
                    </IGRPRadioGroupPrimitive>
                </div>

                <div className="flex items-center space-x-2">
                    <IGRPCheckboxPrimitive
                        id="observability"
                        checked={data.enableObservability}
                        onCheckedChange={(checked) =>
                            onChange({
                                ...data,
                                enableObservability: checked as boolean,
                            })
                        }
                    />
                    <IGRPLabel htmlFor="observability">
                        {t('enableObservability')}
                    </IGRPLabel>
                </div>
            </div>
        </div>
    );
}
