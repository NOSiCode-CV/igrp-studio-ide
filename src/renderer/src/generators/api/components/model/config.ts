import { formatMethods } from '../../helpers'
import { IColumnsTabelProps } from '../Interfaces'

export const initialValues = {
  type: 'model',
  module: '',
  name: '',
  tableName: '',
  audit: true,
  enableCrud: false,
  generationType: 'IDENTITY',
  attributes: [
    {
      name: '',
      type: 'String',
      length: null,
      defaultValue: '',
      nullable: true,
      unique: false,
      primaryKey: false
    }
  ],
  relations: [
    {
      relationType: '',
      entity: '',
      joinColumn: '',
      mappedBy: '',
      joinTable: '',
      inverseJoinColumn: ''
    }
  ],
  crud: [
    {
      enabled: false,
      path: '',
      disabledMethods: []
    }
  ],
  indexes: [
    {
      name: '',
      columns: [],
      unique: false
    }
  ],

  uniqueConstraints: [
    {
      name: '',
      type: '',
      length: '',
      default: ''
    }
  ]
}

export const defaultValues: any = {
  attributes: {
    name: '',
    type: 'String',
    length: 0,
    defaultValue: '',
    nullable: false,
    unique: false,
    primaryKey: false
  },
  relations: {
    relationType: '',
    entity: '',
    joinColumn: '',
    mappedBy: '',
    joinTable: '',
    inverseJoinColumn: ''
  },
  crud: {
    enabled: false,
    path: '',
    disabledMethods: []
  },
  indexes: {
    name: '',
    columns: [],
    options: ''
  },
  uniqueConstraints: {
    name: '',
    columns: [],
    unique: false
  }
}

export const btnLabels = {
  attributes: 'field',
  relations: 'relation',
  indexes: 'index',
  uniqueConstraints: 'unique Constraints'
}

// SELECT, SELECT-MULTI AND CHECKBOX OPTIONS
export type TabType = 'attributes' | 'relations' | 'crud' | 'indexes' | 'uniqueConstraints'

export const TabList = [
  { label: 'Fields', value: 'attributes' },
  { label: 'Relations', value: 'relations' },
  { label: 'CRUD', value: 'crud' },
  { label: 'Indexes', value: 'indexes' },
  { label: 'Constraints', value: 'uniqueConstraints' }
]

export const indexOptionsOptions = [{ label: 'Unique', value: 'unique' }]

// TABLES FORMAT
export const getTablesColumns = ({
  selectors,
  attributes,
  models,
  currentModel
}): { [value: string]: IColumnsTabelProps[] } => {

  const modelsOptions = (models || [])
    .filter((model) => model.name !== currentModel) // Exclude the current model
    .map((model) => ({
      value: model.name,
      label: model.name,
    }));

  const columns = attributes.map((attribute) => ({
    value: attribute.name,
    label: attribute.name
  }))

  const disabledOptions = formatMethods(
    (
      selectors.find((selector) => 'CRUD_DISABLED_OPTIONS' in selector) as
      | { CRUD_DISABLED_OPTIONS: string[] }
      | undefined
    )?.CRUD_DISABLED_OPTIONS || []
  )

  const relationTypeOptions = formatMethods(
    (
      selectors.find((selector) => 'RELATIONSHIP_TYPES' in selector) as
      | { RELATIONSHIP_TYPES: string[] }
      | undefined
    )?.RELATIONSHIP_TYPES || []
  )

  const fieldTypeOptions = formatMethods(
    (
      selectors.find((selector) => 'ATTRIBUTE_TYPES' in selector) as
      | {
        ATTRIBUTE_TYPES: string[]
      }
      | undefined
    )?.ATTRIBUTE_TYPES || []
  )

  return {
    attributes: [
      { key: 'name', name: 'Name', type: 'text' },
      { key: 'type', name: 'Type', type: 'select', options: fieldTypeOptions },
      {
        key: 'group', name: '', type: 'group', items: [
          { key: 'primaryKey', name: 'Primary Key', type: 'checkbox' },
          { key: 'advanced', name: '', type: 'popoverModel' }
        ]
      }
    ],
    relations: [
      {
        key: 'relationType',
        name: 'Relation Type',
        type: 'select',
        options: relationTypeOptions,
        width: '16%'
      },
      { key: 'entity', name: 'Entity', type: 'select', options: modelsOptions, width: '16%' },
      { key: 'joinColumn', name: 'Join Column', type: 'text', width: '16%' },
      { key: 'mappedBy', name: 'Mapped By', type: 'text', width: '16%' },
      { key: 'joinTable', name: 'Join Table', type: 'text', options: [], width: '16%' },
      { key: 'inverseJoinColumn', name: 'Inverse Join Column', type: 'text', width: '16%' }
    ],
    crud: [
      { key: 'path', name: 'Path', type: 'text', width: '25%' },
      {
        key: 'disabledMethods',
        name: 'Disabled Methods',
        type: 'multiSelect',
        options: disabledOptions,
        width: '75%'
      }
    ],
    indexes: [
      { key: 'name', name: 'Name', type: 'text', width: '25%' },
      {
        key: 'columns',
        name: 'Columns',
        type: 'multiSelect',
        options: columns,
        width: '50%'
      },
      {
        key: 'unique',
        name: 'Unique',
        type: 'checkbox',
        width: '25%'
      }
    ],
    uniqueConstraints: [
      { key: 'name', name: 'Name', type: 'text', width: '25%' },
      { key: 'columns', name: 'Columns', type: 'multiSelect', options: columns, width: '50%' }
    ]
  }
}
