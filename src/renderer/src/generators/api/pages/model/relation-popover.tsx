'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronsUpDown } from 'lucide-react'
import {
  IGRPButtonPrimitive,
  IGRPSwitchPrimitive,
  IGRPTabsContentPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsPrimitive,
  IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import {
  IGRPPopoverPrimitive,
  IGRPPopoverContentPrimitive,
  IGRPPopoverTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { RelationTypeSelector } from './relation-type-selector'
import {
  CascadeTypes,
  Relation,
  RelationshipTypes
} from '@igrp/igrp-studio-springboot-engine/types'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import { useTranslation } from 'react-i18next'
import { formatMethods } from '../../helpers'
import { LabelRequired } from '@renderer/components/label-required'
import { TypeSelectorDropdown } from '@renderer/components/type-selector-dropdown'
import MultipleSelector from '@renderer/components/multiples-selector'

interface RelationPopoverProps {
  field: any
  changeValue: (element: string, value: any) => void
  options: any
}

export function RelationPopover({ field, options, changeValue }: RelationPopoverProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { modelsOptions, models } = options

  const [localRelation, setLocalRelation] = useState<Relation>(
    field.relation || {
      type: 'OneToOne',
      entity: '',
      referencedColumnName: '',
      cardinality: 'twoWay',
      inverseJoinColumn: '',
      joinTable: '',
      fetchType: 'lazy',
      mappedBy: '',
      module: '',
      cascadeType: [],
      orphanRemoval: false
    }
  )
  const [availableColumns, setAvailableColumns] = useState<{ value: string; label: string }[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchTypes = formatMethods(['lazy', 'eager'])
  const cascadeTypes = formatMethods(['ALL', 'PERSIST', 'MERGE', 'REMOVE', 'REFRESH', 'DETACH'])

  useEffect(() => {
    if (localRelation.entity) {
      const model = models.find((t: any) => t.content.name === localRelation.entity)
      if (model) {
        const targetTable = model.content.attributes.map((attr: any) => ({
          value: attr.name,
          label: attr.name
        }))
        setAvailableColumns(targetTable || [])
      } else {
        setAvailableColumns([])
      }
    } else {
      setAvailableColumns([])
    }
  }, [localRelation.entity, models])

  const handleUpdate = (): void => {
    if (!localRelation.entity) {
      setErrors({ ['entity']: t('entityRequired') })
      return
    }
    if (!localRelation.fetchType) {
      setErrors({
        ['fetchType']: t('fieldRequired', { name: 'Fetch Type' })
      })
      return
    }
    if (!localRelation.referencedColumnName) {
      setErrors({
        ['referencedColumnName']: t('referencedColumnNameRequired')
      })
      return
    }
    if (localRelation.type === 'ManyToMany' && !localRelation.joinTable) {
      setErrors({ ['joinTable']: t('joinTableRequired') })
      return
    }

    setErrors({})

    changeValue('relation', localRelation)
    setOpen(false)
  }

  return (
    <IGRPPopoverPrimitive onOpenChange={setOpen} open={open}>
      <IGRPPopoverTriggerPrimitive asChild>
        <IGRPButtonPrimitive variant="link">
          {field.relation && field.relation.entity
            ? `${field.relation.type} ${t('with')} ${field.relation.entity}.${field.relation.referencedColumnName}`
            : t('setRelation')}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </IGRPButtonPrimitive>
      </IGRPPopoverTriggerPrimitive>
      <IGRPPopoverContentPrimitive className="w-100 space-y-3">
        <IGRPTabsPrimitive defaultValue="relationSettings">
          <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
            <IGRPTabsTriggerPrimitive value="relationSettings">
              {t('relationSettings')}
            </IGRPTabsTriggerPrimitive>
            <IGRPTabsTriggerPrimitive value="others">{t('others')}</IGRPTabsTriggerPrimitive>
          </IGRPTabsListPrimitive>
          <IGRPTabsContentPrimitive value="relationSettings" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('configureRelationForField')}</p>
              </div>
              <RelationTypeSelector
                value={localRelation.type}
                onChange={(value) =>
                  setLocalRelation({
                    ...localRelation,
                    type: value as RelationshipTypes
                  })
                }
                sourceField={field.name}
                targetField={localRelation.entity || 'entity'}
              />
              <div className="grid grid-cols-2 gap-3">
                {localRelation.type === 'ManyToMany' && (
                  <div className="col-span-2 space-y-2 flex flex-col">
                    <IGRPLabelPrimitive htmlFor="joinTable">{t('entityName')}</IGRPLabelPrimitive>
                    <div>
                      <IGRPInputPrimitive
                        id="joinTable"
                        value={localRelation.joinTable || ''}
                        onChange={(e) =>
                          setLocalRelation({
                            ...localRelation,
                            joinTable: e.target.value
                          })
                        }
                        placeholder={t(t('entityNamePlaceholder'))}
                      />
                      <p className="text-xs text-muted-foreground ">{t('entityNameDescription')}</p>
                      {errors.joinTable && (
                        <p className="text-xs text-red-500">{errors.joinTable}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2 flex flex-col">
                  <IGRPLabelPrimitive htmlFor="entity">{t('entity')}</IGRPLabelPrimitive>
                  <TypeSelectorDropdown
                    type={localRelation.entity}
                    onTypeChange={({ value, module }) =>
                      setLocalRelation({
                        ...localRelation,
                        module,
                        entity: value,
                        referencedColumnName: ''
                      })
                    }
                    schemaTypes={modelsOptions}
                    className={'w-full h-9 text-gray-500'}
                    variant={'outline'}
                  >
                    <ChevronsUpDown />
                  </TypeSelectorDropdown>
                  {errors.entity && <p className="text-xs text-red-500">{errors.entity}</p>}
                </div>
                <div className="space-y-2 flex flex-col">
                  <IGRPLabelPrimitive htmlFor="referencedColumnName">
                    {t('referenceColumnName')}
                  </IGRPLabelPrimitive>
                  <IGRPCombobox
                    value={localRelation.referencedColumnName}
                    options={availableColumns}
                    onChange={(value) =>
                      setLocalRelation({
                        ...localRelation,
                        referencedColumnName: value as string
                      })
                    }
                  />
                  {errors.referencedColumnName && (
                    <p className="text-xs text-red-500">{errors.referencedColumnName}</p>
                  )}
                </div>
              </div>

              {localRelation.cardinality === 'twoWay' && localRelation.type === 'ManyToMany' && (
                <div className="space-y-2">
                  <IGRPLabelPrimitive htmlFor="inverseJoinColumn">
                    {t('fieldNameIn')} {localRelation.joinTable}
                  </IGRPLabelPrimitive>
                  <IGRPInputPrimitive
                    id="inverseJoinColumn"
                    value={localRelation.inverseJoinColumn || ''}
                    onChange={(e) =>
                      setLocalRelation({
                        ...localRelation,
                        inverseJoinColumn: e.target.value
                      })
                    }
                    placeholder={t(t('fieldNamePlaceholder'))}
                  />
                </div>
              )}

              {(localRelation.cardinality === 'twoWay' || localRelation.type === 'OneToMany') &&
                localRelation.type !== 'ManyToMany' && (
                  <div className="space-y-2">
                    <IGRPLabelPrimitive htmlFor="mappedBy">
                      {t('fieldNameIn')} {localRelation.entity}
                    </IGRPLabelPrimitive>
                    <IGRPInputPrimitive
                      id="mappedBy"
                      value={localRelation.mappedBy || ''}
                      onChange={(e) =>
                        setLocalRelation({
                          ...localRelation,
                          mappedBy: e.target.value
                        })
                      }
                      placeholder={t(t('fieldNamePlaceholder'))}
                    />
                  </div>
                )}

              <div className="flex items-center space-x-2">
                <IGRPSwitchPrimitive
                  id="cardinality"
                  checked={localRelation.cardinality === 'twoWay'}
                  onCheckedChange={(checked) =>
                    setLocalRelation({
                      ...localRelation,
                      cardinality: checked ? 'twoWay' : 'oneWay'
                    })
                  }
                />
                <IGRPLabelPrimitive htmlFor="cardinality">
                  {t('twoWayRelationship')}
                </IGRPLabelPrimitive>
              </div>
            </div>
          </IGRPTabsContentPrimitive>
          <IGRPTabsContentPrimitive value="others" className="space-y-4">
            <div className="space-y-2 flex flex-col">
              <LabelRequired>{t('fetchType')}</LabelRequired>
              <IGRPCombobox
                value={localRelation.fetchType}
                options={fetchTypes}
                onChange={(value) =>
                  setLocalRelation({
                    ...localRelation,
                    fetchType: value as 'lazy' | 'eager'
                  })
                }
                required
              />
              {errors.fetchType && <p className="text-xs text-red-500">{errors.fetchType}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <IGRPSwitchPrimitive
                name="Orphan Removal"
                id="Orphan Removal"
                checked={localRelation.orphanRemoval}
                onCheckedChange={(checked) =>
                  setLocalRelation({
                    ...localRelation,
                    orphanRemoval: checked
                  })
                }
              />
              <IGRPLabelPrimitive htmlFor="orphanRemoval">{t('orphanRemoval')}</IGRPLabelPrimitive>
            </div>
            <div className="space-y-2 flex flex-col">
              <LabelRequired>{t('cascadeType')}</LabelRequired>
              <MultipleSelector
                value={localRelation?.cascadeType?.map((item) => item.type) || []}
                options={cascadeTypes}
                onChange={(selectedValues: string[]) => {
                  setLocalRelation({
                    ...localRelation,
                    cascadeType: selectedValues.map((value) => ({
                      type: value as CascadeTypes
                    }))
                  })
                }}
                placeholder={t('selectCascadeTypes')}
              />
            </div>
          </IGRPTabsContentPrimitive>
        </IGRPTabsPrimitive>
        <div className="flex justify-between">
          <IGRPButtonPrimitive variant="outline" onClick={() => changeValue('relation', undefined)}>
            {t('removeRelation')}
          </IGRPButtonPrimitive>
          <IGRPButtonPrimitive onClick={handleUpdate}>{t('apply')}</IGRPButtonPrimitive>
        </div>
      </IGRPPopoverContentPrimitive>
    </IGRPPopoverPrimitive>
  )
}
