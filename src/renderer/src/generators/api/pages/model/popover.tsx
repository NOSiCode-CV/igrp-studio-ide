import {
  IGRPButtonPrimitive,
  IGRPPopoverContentPrimitive,
  IGRPPopoverTriggerPrimitive,
  IGRPSeparatorPrimitive,
  IGRPSwitchPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPPopoverPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  IGRPTabsPrimitive,
  IGRPTabsContentPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { PackageCheck } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import { TextInput } from '../../components/inputs-form'

interface PopoverProps {
  children?: ReactNode
  index: number
  row: any
  options: any
  changeValue: (element: string, position: number, value: any) => void
}

export function PopoverModel({ index, row, options, changeValue }: PopoverProps) {
  const { t } = useTranslation()

  const [isPrimary, setIsPrimary] = useState(false)

  const [isSequence, setIsSequence] = useState(false)

  const onChangeGenerationType = (value: string): void => {
    changeValue('generationType', index, value)

    setIsSequence(value === 'SEQUENCE')
  }

  return (
    <IGRPPopoverPrimitive>
      <IGRPTooltipPrimitive>
        <IGRPTooltipTriggerPrimitive asChild>
          <IGRPPopoverTriggerPrimitive asChild>
            <IGRPButtonPrimitive variant="ghost" className="flex items-center" size={'icon'}>
              <PackageCheck className="w-4 h-4" />
              <span className="sr-only">{t('advanced')}</span>
            </IGRPButtonPrimitive>
          </IGRPPopoverTriggerPrimitive>
        </IGRPTooltipTriggerPrimitive>
        <IGRPTooltipContentPrimitive side="top" align="center">
          {t('openAdvancedSettings')}
        </IGRPTooltipContentPrimitive>
      </IGRPTooltipPrimitive>
      <IGRPPopoverContentPrimitive className="w-100" align="end" side="bottom">
        <div className="grid gap-4">
          <div className="space-y-2">
            <IGRPTabsPrimitive defaultValue="dataType">
              <IGRPTabsListPrimitive className="grid w-full grid-cols-1">
                <IGRPTabsTriggerPrimitive value="dataType">
                  {t('settings')}
                </IGRPTabsTriggerPrimitive>
              </IGRPTabsListPrimitive>

              <IGRPTabsContentPrimitive value="dataType" className="space-y-4">
                <div className="flex flex-1 gap-2">
                  {['unique', 'nullable', 'primaryKey'].map((field) => (
                    <div key={`${field}-${index}`} className="flex flex-1 items-center gap-4">
                      <IGRPLabelPrimitive htmlFor={`${field}-${index}`}>
                        {t(field)}
                      </IGRPLabelPrimitive>
                      <IGRPSwitchPrimitive
                        id={`${field}-${index}`}
                        onCheckedChange={(checked) => {
                          changeValue(field, index, checked)
                          setIsPrimary(field === 'primaryKey')
                        }}
                        checked={row?.[field] || false}
                      />
                    </div>
                  ))}
                </div>
                {options.revision && (
                  <>
                    <IGRPSeparator orientation="horizontal" />

                    <div className="flex flex-1 gap-2">
                      <div className="flex flex-1 items-center gap-4">
                        <IGRPLabelPrimitive htmlFor={`skipFieldRevision`}>
                          {t('skipFieldRevision')}
                        </IGRPLabelPrimitive>
                        <IGRPSwitchPrimitive
                          id={`skipFieldRevision-${index}`}
                          onCheckedChange={(checked) =>
                            changeValue('skipFieldRevision', index, checked)
                          }
                          checked={row?.['skipFieldRevision'] || false}
                        />
                      </div>
                    </div>
                  </>
                )}
                <IGRPSeparatorPrimitive orientation="horizontal" />
                <div className="flex flex-col gap-2">
                  {isPrimary && (
                    <>
                      <div className="space-y-2 col-span-2 flex flex-col">
                        <IGRPLabelPrimitive>{t('generationType')}</IGRPLabelPrimitive>
                        <IGRPCombobox
                          placeholder={`Select Generation Type`}
                          options={options.generateTypes}
                          value={row?.['generationType'] || 'IDENTITY'}
                          onChange={(value) => onChangeGenerationType(value as string)}
                          className="w-full h-8"
                        />
                      </div>

                      {isSequence && (
                        <TextInput
                          label="Sequence Name"
                          id="sequenceName"
                          className="h-8"
                          value={row?.['sequenceName'] || ''}
                          onChange={(ev) => changeValue('sequenceName', index, ev.target.value)}
                          placeholder="Enter the custom sequence name"
                        />
                      )}
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <IGRPLabelPrimitive>{t('length')}</IGRPLabelPrimitive>
                    <IGRPInputPrimitive
                      id="length"
                      className="h-8"
                      value={row?.['length'] || ''}
                      onChange={(ev) => changeValue('length', index, ev.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <IGRPLabelPrimitive>{t('defaultValue')}</IGRPLabelPrimitive>
                    <IGRPInputPrimitive
                      id="defaultValue"
                      className="h-8"
                      value={row?.['defaultValue'] || ''}
                      onChange={(ev) => changeValue('defaultValue', index, ev.target.value)}
                    />
                  </div>
                </div>
              </IGRPTabsContentPrimitive>
            </IGRPTabsPrimitive>
          </div>
        </div>
      </IGRPPopoverContentPrimitive>
    </IGRPPopoverPrimitive>
  )
}
