'use client'

import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import { LabelRequired } from '@renderer/components/label-required'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Textarea } from '@renderer/components/ui/textarea'
import { DjangoDatabaseOptions } from '@renderer/constants/appConstants'
import { useTranslation } from 'react-i18next'
import type { DjangoConfigData } from 'src/main/types'

interface DjangoConfigProps {
    data: DjangoConfigData
    errors?: { config?: Record<string, string | undefined> }
    onChange: (data: DjangoConfigData) => void
}

export const DEFAULT_DJANGO_CONFIG: DjangoConfigData = {
    name: '',
    description: '',
    artifact: '',
    database: 'PostgreSQL',
    projectStructureStyle: 'technical',
    enableObservability: false,
    enableEntityRevision: false,
    enableGraphQL: false
}

export function DjangoConfig({
    data = DEFAULT_DJANGO_CONFIG,
    errors,
    onChange
}: DjangoConfigProps): React.ReactNode {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <LabelRequired>{t('projectName')}</LabelRequired>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => onChange({ ...data, name: e.target.value })}
                    placeholder={t('enterProjectName')}
                    maxLength={20}
                />
                {errors?.config?.name && (
                    <p className="text-xs text-destructive">{errors.config.name}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => onChange({ ...data, description: e.target.value })}
                    placeholder={t('enterDescription')}
                />
            </div>

            <div className="space-y-2">
                <LabelRequired>{t('artifact')}</LabelRequired>
                <Input
                    id="artifact"
                    value={data.artifact}
                    onChange={(e) => onChange({ ...data, artifact: e.target.value })}
                    placeholder="my_api"
                    maxLength={20}
                />
                {errors?.config?.artifact && (
                    <p className="text-xs text-destructive">{errors.config.artifact}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                    <LabelRequired>{t('chooseDbEngine')}</LabelRequired>
                    <IGRPCombobox
                        value={data.database}
                        onChange={(value) =>
                            onChange({ ...data, database: value as DjangoConfigData['database'] })
                        }
                        options={DjangoDatabaseOptions}
                        className="w-full"
                    />
                    {errors?.config?.database && (
                        <p className="text-xs text-destructive">{errors.config.database}</p>
                    )}
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
                                projectStructureStyle: value as 'technical' | 'domain'
                            })
                        }
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="technical" id="django-technical" />
                            <Label htmlFor="django-technical">{t('technical')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="domain" id="django-domain" />
                            <Label htmlFor="django-domain">{t('domainDriven')}</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="django-observability"
                            checked={data.enableObservability}
                            onCheckedChange={(checked) =>
                                onChange({
                                    ...data,
                                    enableObservability: checked as boolean
                                })
                            }
                        />
                        <Label htmlFor="django-observability">{t('enableObservability')}</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="django-graphql"
                            checked={!!data.enableGraphQL}
                            onCheckedChange={(checked) =>
                                onChange({
                                    ...data,
                                    enableGraphQL: checked as boolean
                                })
                            }
                        />
                        <Label htmlFor="django-graphql">{t('enableGraphQL')}</Label>
                    </div>
                </div>
            </div>
        </div>
    )
}
