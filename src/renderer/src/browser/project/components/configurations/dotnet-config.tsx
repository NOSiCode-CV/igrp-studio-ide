'use client'

import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Textarea } from '@renderer/components/ui/textarea'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import { LabelRequired } from '@renderer/components/label-required'
import { DotnetDatabaseOptions } from '@renderer/constants/appConstants'
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

export const DEFAULT_DOTNET_CONFIG: DotNetConfigData = {
    name: '',
    description: '',
    artifact: '',
    database: 'Postgresql',
    projectStructureStyle: 'technical',
    enableObservability: false,
    enableGraphQL: false,
    // Default to false; entity-revision tracking adds a non-trivial audit
    // schema and is opt-in.
    enableEntityRevision: false
}

export function DotNetConfig({
    data = DEFAULT_DOTNET_CONFIG,
    errors,
    onChange
}: DotNetConfigProps): React.ReactNode {
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
                    placeholder={t('enterArtifact')}
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
                        onChange={(value) => onChange({ ...data, database: value })}
                        options={DotnetDatabaseOptions}
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
                            <RadioGroupItem value="technical" id="technical" />
                            <Label htmlFor="technical">{t('technical')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="domain" id="domain" />
                            <Label htmlFor="domain">{t('domainDriven')}</Label>
                        </div>
                    </RadioGroup>
                    {errors?.config?.projectStructureStyle && (
                        <p className="text-xs text-destructive">
                            {errors.config.projectStructureStyle}
                        </p>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="observability"
                        checked={data.enableObservability}
                        onCheckedChange={(checked) =>
                            onChange({
                                ...data,
                                enableObservability: checked as boolean
                            })
                        }
                    />
                    <Label htmlFor="observability">{t('enableObservability')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="dotnet-entity-revision"
                        checked={data.enableEntityRevision}
                        onCheckedChange={(checked) =>
                            onChange({
                                ...data,
                                enableEntityRevision: checked as boolean
                            })
                        }
                    />
                    <Label htmlFor="dotnet-entity-revision">{t('enableEntityRevision')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="dotnet-graphql"
                        checked={!!data.enableGraphQL}
                        onCheckedChange={(checked) =>
                            onChange({
                                ...data,
                                enableGraphQL: checked as boolean
                            })
                        }
                    />
                    <Label htmlFor="dotnet-graphql">{t('enableGraphQL')}</Label>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="dotnet-auth">Authentication</Label>
                <IGRPCombobox
                    value={data.authMode ?? ''}
                    onChange={(value) =>
                        onChange({
                            ...data,
                            authMode: value === 'keycloak' || value === 'autentika' ? value : undefined
                        })
                    }
                    options={[
                        { value: '', label: 'Disabled' },
                        { value: 'keycloak', label: 'Keycloak' },
                        { value: 'autentika', label: 'Autentika' }
                    ]}
                    className="w-full"
                />
            </div>
        </div>
    )
}
