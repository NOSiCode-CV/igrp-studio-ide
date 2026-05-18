'use client'

import {
    IGRPCheckboxPrimitive,
    IGRPCombobox,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPRadioGroupItemPrimitive,
    IGRPRadioGroupPrimitive,
    IGRPTextAreaPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { LabelRequired } from '@renderer/components/label-required'
import { DatabaseOptions } from '@renderer/constants/appConstants'
import { useTranslation } from 'react-i18next'
import type { DotNetConfigData } from 'src/main/types'

interface DotNetConfigProps {
    data: DotNetConfigData
    /**
     * Flattened error bag passed from the parent wizard. The shape matches
     * what the sibling configs (next/spring/specification) already read:
     * `errors.config.<field>` is a string. The parent translates the
     * RHF error object into this shape before handing it down.
     */
    errors?: { config?: Record<string, string | undefined> }
    onChange: (data: DotNetConfigData) => void
}

const DEFAULT_DOTNET_CONFIG: DotNetConfigData = {
    name: '',
    description: '',
    artifact: '',
    database: 'Postgresql',
    projectStructureStyle: 'technical',
    enableObservability: false,
    version: ''
}

export function DotNetConfig({
    data = DEFAULT_DOTNET_CONFIG,
    onChange
}: DotNetConfigProps): React.ReactNode {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <LabelRequired>{t('projectName')}</LabelRequired>
                <IGRPInputPrimitive
                    id="name"
                    value={data.name}
                    onChange={(e) => onChange({ ...data, name: e.target.value })}
                    placeholder={t('enterProjectName')}
                    maxLength={20}
                />
            </div>

            <div className="space-y-2">
                <IGRPLabelPrimitive htmlFor="description">{t('description')}</IGRPLabelPrimitive>
                <IGRPTextAreaPrimitive
                    id="description"
                    value={data.description}
                    onChange={(e) => onChange({ ...data, description: e.target.value })}
                    placeholder={t('enterDescription')}
                />
            </div>

            <div className="space-y-2">
                <LabelRequired>{t('artifact')}</LabelRequired>
                <IGRPInputPrimitive
                    id="artifact"
                    value={data.artifact}
                    onChange={(e) => onChange({ ...data, artifact: e.target.value })}
                    placeholder={t('enterArtifact')}
                    maxLength={20}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                    <LabelRequired>{t('chooseDbEngine')}</LabelRequired>
                    <IGRPCombobox
                        value={data.database}
                        onChange={(value) => onChange({ ...data, database: value })}
                        options={DatabaseOptions}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2">
                <div className="space-y-3">
                    <IGRPLabelPrimitive>{t('projectStructureStyle')}</IGRPLabelPrimitive>
                    <IGRPRadioGroupPrimitive
                        value={data.projectStructureStyle}
                        onValueChange={(value) =>
                            onChange({
                                ...data,
                                projectStructureStyle: value as 'technical' | 'domain'
                            })
                        }
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <IGRPRadioGroupItemPrimitive value="technical" id="technical" />
                            <IGRPLabelPrimitive htmlFor="technical">
                                {t('technical')}
                            </IGRPLabelPrimitive>
                        </div>
                        <div className="flex items-center space-x-2">
                            <IGRPRadioGroupItemPrimitive value="domain" id="domain" />
                            <IGRPLabelPrimitive htmlFor="domain">
                                {t('domainDriven')}
                            </IGRPLabelPrimitive>
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
                                enableObservability: checked as boolean
                            })
                        }
                    />
                    <IGRPLabelPrimitive htmlFor="observability">
                        {t('enableObservability')}
                    </IGRPLabelPrimitive>
                </div>
            </div>
        </div>
    )
}
