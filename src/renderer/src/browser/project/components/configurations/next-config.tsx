'use client'

import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { LabelRequired } from '@renderer/components/label-required'
import { useTranslation } from 'react-i18next'
import type { NextConfigData } from 'src/main/types'

interface NextConfigProps {
    data: NextConfigData
    errors?: any
    onChange: (data: NextConfigData) => void
}

const DEFAULT_NEXT_CONFIG: NextConfigData = {
    name: '',
    description: '',
    workspaceId: '',
    id: '',
    version: ''
}

export function NextConfig({ data = DEFAULT_NEXT_CONFIG, errors, onChange }: NextConfigProps) {
    const { t } = useTranslation()
    return (
        <div className="rounded-lg border p-4  space-y-6">
            <div className="space-y-2">
                <LabelRequired>{t('applicationName')}</LabelRequired>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => onChange({ ...data, name: e.target.value })}
                    placeholder="my-next-app"
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
                    value={data.description}
                    onChange={(e) => onChange({ ...data, description: e.target.value })}
                    placeholder={t('projectDescription')}
                />
            </div>
        </div>
    )
}
