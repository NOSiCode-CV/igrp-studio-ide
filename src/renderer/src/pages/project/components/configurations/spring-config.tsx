import {
    IGRPCheckboxPrimitive,
    IGRPLabelPrimitive,
    IGRPTextAreaPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import { SpringConfigData } from 'src/main/types';
import {
    DatabaseOptions,
    projectStructureStyle,
} from '@renderer/constants/appConstants';
import { useTranslation } from 'react-i18next';
import { LabelRequired } from '@renderer/components/label-required';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';
import { SelectInput } from '@renderer/generators/api/components/inputs-form';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import DependencySelector from '@renderer/components/dependency-selector';
import { JSX } from 'react';

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
    version: '',
    dependencies: [],
    enableGraalVm: false,
};

export function SpringConfig({
    data = DEFAULT_SPRING_CONFIG,
    errors,
    onChange,
}: SpringConfigProps): JSX.Element {
    const { t } = useTranslation(); // Hook for translations

    const PackageName = (): React.ReactNode => {
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
        <div className="rounded-lg border p-4  space-y-6">
            <div className="flex flex-col gap-3">
                <LabelRequired>{t('projectName')}</LabelRequired>
                <IGRPInputText
                    id="name"
                    value={data.name}
                    onChange={(e) =>
                        onChange({ ...data, name: e.target.value })
                    }
                    placeholder={t('enterProjectName')}
                    maxLength={100}
                />
                {errors?.config && errors.config.name && (
                    <p className="text-xs text-destructive">
                        {errors.config.name}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <IGRPLabelPrimitive htmlFor="description">
                    {t('description')}
                </IGRPLabelPrimitive>
                <IGRPTextAreaPrimitive
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
                    <IGRPInputText
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
                    <IGRPInputText
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
            </div>

            <IGRPSeparator orientation="horizontal" />

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
                        <IGRPLabelPrimitive htmlFor="observability">
                            {t('enableObservability')}
                        </IGRPLabelPrimitive>
                    </div>
                    <div className="flex items-center space-x-2">
                        <IGRPCheckboxPrimitive
                            id="enableEntityRevision"
                            checked={data.enableEntityRevision}
                            onCheckedChange={(checked) =>
                                onChange({
                                    ...data,
                                    enableEntityRevision: checked as boolean,
                                })
                            }
                        />
                        <IGRPLabelPrimitive htmlFor="enableEntityRevision">
                            {t('enableEntityRevision')}
                        </IGRPLabelPrimitive>
                    </div>
                    <div className="flex items-center space-x-2">
                        <IGRPCheckboxPrimitive
                            id="enableGraalVm"
                            checked={data.enableGraalVm}
                            onCheckedChange={(checked) =>
                                onChange({
                                    ...data,
                                    enableGraalVm: checked as boolean,
                                })
                            }
                        />
                        <IGRPLabelPrimitive htmlFor="enableGraalVm">
                            {t('enableGraalVm')}
                        </IGRPLabelPrimitive>
                    </div>
                </div>
            </div>

            <IGRPSeparator orientation="horizontal" />

            <DependencySelector
                onSelectedDependencies={(dependencies) =>
                    onChange({ ...data, dependencies })
                }
            />
        </div>
    );
}
