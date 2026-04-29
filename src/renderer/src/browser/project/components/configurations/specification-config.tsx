'use client'

import {
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPTextAreaPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { LabelRequired } from '@renderer/components/label-required'
import { useTranslation } from 'react-i18next'
import type { SpecificationConfigData } from 'src/main/types'

interface SpecificationConfigProps {
    data: SpecificationConfigData
    errors?: any
    onChange: (data: SpecificationConfigData) => void
}

const DEFAULT_SPEC_CONFIG: SpecificationConfigData = {
    name: '',
    description: '',
    workspaceId: '',
    id: '',
    version: '',
    defaultLLM: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4.5' },
    embeddings: { provider: 'openai', model: 'text-embedding-3-small' }
}

export function SpecificationConfig({
    data = DEFAULT_SPEC_CONFIG,
    errors,
    onChange
}: SpecificationConfigProps) {
    const { t } = useTranslation()
    const value = { ...DEFAULT_SPEC_CONFIG, ...data }

    return (
        <div className="rounded-lg border p-4 space-y-6">
            <div className="space-y-2">
                <LabelRequired>{t('applicationName')}</LabelRequired>
                <IGRPInputPrimitive
                    id="name"
                    value={value.name}
                    onChange={(e) => onChange({ ...value, name: e.target.value })}
                    placeholder="my-spec-project"
                    maxLength={100}
                />
                {errors?.config && errors.config.name && (
                    <p className="text-xs text-destructive">{errors.config.name}</p>
                )}
            </div>

            <div className="space-y-2">
                <IGRPLabelPrimitive htmlFor="description">{t('description')}</IGRPLabelPrimitive>
                <IGRPTextAreaPrimitive
                    id="description"
                    value={value.description}
                    onChange={(e) => onChange({ ...value, description: e.target.value })}
                    placeholder="Document and prototype using AI"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <IGRPLabelPrimitive htmlFor="defaultLLM">Default LLM</IGRPLabelPrimitive>
                    <IGRPInputPrimitive
                        id="defaultLLM"
                        value={value.defaultLLM?.model ?? ''}
                        onChange={(e) =>
                            onChange({
                                ...value,
                                defaultLLM: {
                                    provider: value.defaultLLM?.provider ?? 'openrouter',
                                    model: e.target.value
                                }
                            })
                        }
                        placeholder="anthropic/claude-sonnet-4.5"
                    />
                </div>
                <div className="space-y-2">
                    <IGRPLabelPrimitive htmlFor="embeddings">Embeddings model</IGRPLabelPrimitive>
                    <IGRPInputPrimitive
                        id="embeddings"
                        value={value.embeddings?.model ?? ''}
                        onChange={(e) =>
                            onChange({
                                ...value,
                                embeddings: {
                                    provider: value.embeddings?.provider ?? 'openai',
                                    model: e.target.value
                                }
                            })
                        }
                        placeholder="text-embedding-3-small"
                    />
                </div>
            </div>
        </div>
    )
}
