import type { ModelConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import type { SchemaTypeItem } from 'src/main/types'
import { formatMethods, getOptionsByObject } from '../../helpers'
import type { IColumnsTabelProps } from '../../types/Interfaces'

/**
 * Per-framework default value for the primary-key column's `generationType`.
 *
 * The string is engine-specific:
 *  - Spring (JPA): `'IDENTITY'` (the historical Studio default)
 *  - .NET (EF Core): `'Identity'` — EF Core's `StoreValueGenerationStrategy`
 *    enum is case-sensitive; sending `'IDENTITY'` makes
 *    `@igrp/dotnet-engine` reject the model with "must be one of
 *    Identity,Computed,None"
 *
 * Falls back to empty string for unknown frameworks. The engine schemas
 * treat empty as "not provided", which is universally accepted.
 *
 * Extend this map when adding a new backend engine instead of branching at
 * call sites — keeps the framework-aware surface in one place.
 */
const PRIMARY_KEY_GENERATION_BY_FRAMEWORK: Partial<Record<ENV_TYPES, string>> = {
    [ENV_TYPES.SPRING]: 'IDENTITY',
    [ENV_TYPES.DOTNET]: 'Identity'
}

export const defaultPrimaryKeyGenerationType = (framework: ENV_TYPES): string =>
    PRIMARY_KEY_GENERATION_BY_FRAMEWORK[framework] ?? ''

/**
 * Build the initial form state for a new model. The only framework-aware bit
 * is the primary-key `generationType` (see
 * `PRIMARY_KEY_GENERATION_BY_FRAMEWORK`); everything else is engine-agnostic.
 */
export const getInitialValues = (framework: ENV_TYPES) => ({
    type: 'model',
    module: '',
    name: '',
    tableName: '',
    audit: true,
    crud: false,
    revision: false,
    attributes: [
        {
            name: 'id',
            type: 'integer',
            length: null,
            defaultValue: '',
            nullable: false,
            unique: false,
            primaryKey: true,
            generationType: defaultPrimaryKeyGenerationType(framework),
            skipFieldRevision: false
        },
        {
            name: '',
            type: 'string',
            length: null,
            defaultValue: '',
            nullable: true,
            unique: false,
            primaryKey: false,
            skipFieldRevision: false
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
            columns: []
        }
    ]
})

/**
 * @deprecated kept for backwards compatibility — call `getInitialValues(framework)` instead.
 * Resolves to Spring defaults so legacy consumers stay on the historical behaviour.
 */
export const initialValues = getInitialValues(ENV_TYPES.SPRING)

export const defaultValues: any = {
    attributes: {
        name: '',
        type: 'string',
        length: 0,
        defaultValue: '',
        nullable: false,
        unique: false,
        primaryKey: false,
        skipFieldRevision: false
    },
    indexes: {
        name: '',
        columns: [],
        unique: false
    },
    uniqueConstraints: {
        name: '',
        columns: []
    }
}

export const btnLabels = {
    attributes: 'field',
    relations: 'relation',
    indexes: 'index',
    uniqueConstraints: 'unique Constraints'
}

// SELECT, SELECT-MULTI AND CHECKBOX OPTIONS
export type TabType = 'attributes' | 'indexes' | 'uniqueConstraints'

export const TabList = [
    { label: 'Fields', value: 'attributes' },
    { label: 'Indexes', value: 'indexes' },
    { label: 'Unique Constraints', value: 'uniqueConstraints' }
]

export const indexOptionsOptions = [{ label: 'Unique', value: 'unique' }]

/**
 * Namespace value the engine schema expects for "native data types".
 * Mirrors the mapping in `dto/config.ts`; kept inline here rather than in a
 * shared util because both files are small and the indirection isn't worth
 * the extra import.
 */
const NATIVE_TYPE_NAMESPACE: Partial<Record<ENV_TYPES, string>> = {
    [ENV_TYPES.SPRING]: 'java',
    [ENV_TYPES.DOTNET]: 'dotnet'
}
const nativeTypeNamespace = (framework: ENV_TYPES): string =>
    NATIVE_TYPE_NAMESPACE[framework] ?? 'java'

// TABLES FORMAT
export const getTablesColumns = ({
    selectors,
    attributes,
    revision,
    models,
    enums,
    currentItem,
    framework,
    t
}: {
    selectors: any
    attributes: any
    revision: any
    models: any
    enums: any
    currentItem: any
    framework: ENV_TYPES
    t: any
}): { [value: string]: IColumnsTabelProps[] } => {
    const { module } = currentItem || {}

    const modelsOptions = (models || [])
        .filter((model: any) => model.content?.name !== name)
        .map((model: any) => ({
            value: model.content?.name || model.name,
            label: model.content?.name || model.name,
            module: model.content?.module
        }))

    const columns = attributes.map((attribute: any) => ({
        value: attribute.name,
        label: attribute.name
    }))

    // Spring's `ATTRIBUTE_TYPES` selector returns a grouped object
    // (`{numeric: [...], text: [...], ...}`) while .NET returns a flat
    // `string[]` (`['integer', 'string', ...]`). `TypeSelectorDropdown`'s
    // "array" branch reads `subItem.label` and expects `{label, value}`
    // objects, so a raw string array renders blank rows (looks like
    // invisible text). Wrap the flat-array case so both engines produce a
    // valid items shape for the dropdown.
    const rawDataTypes =
        (
            selectors.find((selector: any) => 'ATTRIBUTE_TYPES' in selector) as
                | { ATTRIBUTE_TYPES: string[] | Record<string, string[]> }
                | undefined
        )?.ATTRIBUTE_TYPES || []
    const dataTypes = Array.isArray(rawDataTypes) ? formatMethods(rawDataTypes) : rawDataTypes

    const generateTypes = formatMethods(
        (
            selectors.find((selector: any) => 'GENERATION_TYPES' in selector) as
                | { GENERATION_TYPES: string[] }
                | undefined
        )?.GENERATION_TYPES || []
    )

    const enumMap = getOptionsByObject(enums, module, null)

    const fieldTypeOptions: SchemaTypeItem[] = [
        { label: t('dataTypes'), value: nativeTypeNamespace(framework), items: dataTypes },
        { label: t('enum'), value: 'enum', items: enumMap },
        { label: t('relation'), value: 'relation' }
    ]

    return {
        attributes: [
            { key: 'name', name: t('name'), type: 'text' },
            {
                key: 'type',
                name: t('type'),
                type: 'typeSelectorDropdown',
                options: fieldTypeOptions
            },
            {
                key: 'group',
                name: '',
                type: 'group',
                items: [
                    {
                        key: 'primaryKey',
                        name: 'Primary Key',
                        type: 'checkbox'
                    },
                    {
                        key: 'advanced',
                        name: '',
                        type: 'popoverModel',
                        options: { generateTypes, revision }
                    },
                    {
                        key: 'relation',
                        name: 'Relation',
                        type: 'popoverRelation',
                        options: { modelsOptions, models }
                    }
                ]
            }
        ],
        indexes: [
            { key: 'name', name: t('name'), type: 'text' },
            {
                key: 'columns',
                name: t('columns'),
                type: 'multiSelect',
                options: columns
            },
            {
                key: 'unique',
                name: t('unique'),
                type: 'checkbox'
            }
        ],
        uniqueConstraints: [
            { key: 'name', name: t('name'), type: 'text' },
            {
                key: 'columns',
                name: t('columns'),
                type: 'multiSelect',
                options: columns
            }
        ]
    }
}

export const getValuesToSubmit = (values: any, module: string) => {
    const uniqueConstraints = values.uniqueConstraints?.filter((rel: any) => rel.name !== '') || []

    const indexes = values.indexes?.filter((idx: any) => idx.name !== '') || []

    const attributes = values.attributes.map(({ ...field }) => ({
        ...field,
        length: field.length ? Number(field.length) : 255,
        nullable: !field.nullable
    }))

    const primaryKey = values.attributes
        .filter((attribute: any) => attribute.primaryKey === true)
        .map(({ name, type }: { name: string; type: string }) => ({
            name,
            type
        }))

    const hasListPk = primaryKey.length > 1

    const filteredAttributes = hasListPk
        ? attributes.filter((attribute: any) => attribute.primaryKey !== true)
        : attributes

    const newValues: ModelConfig = {
        ...values,
        attributes: filteredAttributes,
        uniqueConstraints,
        indexes,
        primaryKey: hasListPk ? primaryKey : [],
        module
    }

    return newValues
}
