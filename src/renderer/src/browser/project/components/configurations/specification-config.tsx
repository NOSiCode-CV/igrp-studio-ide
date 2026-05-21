'use client'

import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { LabelRequired } from '@renderer/components/label-required'
import { useTranslation } from 'react-i18next'
import type { SpecificationConfigData } from 'src/main/types'

interface SpecificationConfigProps {
    data: SpecificationConfigData
    errors?: any
    onChange: (data: SpecificationConfigData) => void
}

// `defaultLLM` and `embeddings` are still persisted with sensible defaults so
// downstream consumers (specs engine, AI services) keep working — they are
// just no longer exposed in the wizard, since users were picking model
// strings without enough context to make the choice meaningful here.
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
                <Input
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
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                    id="description"
                    value={value.description}
                    onChange={(e) => onChange({ ...value, description: e.target.value })}
                    placeholder="Document and prototype using AI"
                />
            </div>
        </div>
    )
}
