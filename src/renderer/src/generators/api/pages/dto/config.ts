import { DTOConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { formatMethods, getOptionsByObject } from '../../helpers'
import { IColumnsTabelProps } from '../../types/Interfaces'
import { SchemaTypeItem } from 'src/main/types'

export const initialValues: DTOConfig = {
  type: 'dto',
  module: '',
  name: '',
  template: 'classic',
  enableCustonValidation: false,
  readOnly: false,
  extends: {
    name: '',
    module: ''
  },
  attributes: [
    {
      name: '',
      objectType: 'java',
      type: 'string',
      required: false,
      before: false,
      after: false,
      positive: false,
      minLength: undefined,
      maxLength: undefined,
      regex: '',
      isEmail: false,
      isUrl: false,
      primaryKey: false,
      collectionType: ''
    }
  ]
}

export const TabList = [{ label: 'Fields', value: 'attributes' }]

export const TemplateOptions = [
  { label: 'Default', value: 'classic' },
  { label: 'Record', value: 'record' }
]

export const getTablesColumns = ({
  selectors,
  dto,
  models,
  enums,
  current,
  t
}: {
  selectors: any
  dto: any
  models: any
  enums: any
  current: any
  t: any
}): { [value: string]: IColumnsTabelProps[] } => {
  const { name: currentDto, module } = current || {}

  const collectionTypes = formatMethods(
    (
      selectors.find((selector: any) => 'COLLECTION_TYPES' in selector) as
        | { COLLECTION_TYPES: string[] }
        | undefined
    )?.COLLECTION_TYPES || [],
    true
  )

  const dataTypes =
    (
      selectors.find((selector: any) => 'ATTRIBUTE_TYPES' in selector) as
        | {
            ATTRIBUTE_TYPES: string[]
          }
        | undefined
    )?.ATTRIBUTE_TYPES || []

  const dtos = getOptionsByObject(dto, module, currentDto)

  const namespacesOptions: SchemaTypeItem[] = [
    { label: t('dto'), value: 'dto', items: dtos },
    {
      label: t('model'),
      value: 'model',
      items: getOptionsByObject(models, module, currentDto)
    },
    { label: t('dataTypes'), value: 'java', items: dataTypes },
    {
      label: t('enum'),
      value: 'enum',
      items: getOptionsByObject(enums, module, currentDto)
    }
  ]

  return {
    attributes: [
      { key: 'name', name: t('name'), type: 'text' },
      {
        key: 'type',
        name: t('type'),
        type: 'typeSelectorDropdown',
        options: namespacesOptions
      },
      {
        key: 'group',
        name: '',
        type: 'group',
        items: [
          {
            key: 'advanced',
            name: '',
            type: 'popoverDto',
            options: collectionTypes
          }
        ]
      }
    ]
  }
}
