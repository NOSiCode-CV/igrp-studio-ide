'use client'

import { IGRPLabelPrimitive, IGRPTextAreaPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { NextConfigData } from 'src/main/types'
import { useTranslation } from 'react-i18next'
import { LabelRequired } from '@renderer/components/label-required'

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
        <IGRPInputPrimitive
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
        <IGRPLabelPrimitive htmlFor="description">{t('description')}</IGRPLabelPrimitive>
        <IGRPTextAreaPrimitive
          id="description"
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder={t('projectDescription')}
        />
      </div>
    </div>
  )
}
