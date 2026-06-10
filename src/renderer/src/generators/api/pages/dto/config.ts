import type { DTOConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import type { SchemaTypeItem } from 'src/main/types'
import { formatMethods, getOptionsByObject } from '../../helpers'
import type { IColumnsTabelProps } from '../../types/Interfaces'

/**
 * Namespace value the engine schema expects for "native data types".
 * Spring's `objectType` enum accepts `'java'`; .NET's accepts `'dotnet'`.
 * Falls back to `'java'` so unknown frameworks keep the historical Spring
 * behaviour. Extend the map when adding a new backend engine.
 */
const NATIVE_TYPE_NAMESPACE: Partial<Record<ENV_TYPES, string>> = {
    [ENV_TYPES.SPRING]: 'java',
    [ENV_TYPES.DOTNET]: 'dotnet'
}
const nativeTypeNamespace = (framework: ENV_TYPES): string =>
    NATIVE_TYPE_NAMESPACE[framework] ?? 'java'

/**
 * Build the initial form state for a new DTO. The framework-aware bit is the
 * first attribute's `objectType` — see `NATIVE_TYPE_NAMESPACE` below.
 */
export const getInitialValues = (framework: ENV_TYPES): DTOConfig => ({
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
            // `nativeTypeNamespace` yields 'dotnet' for .NET projects — a value
            // the shared Spring `DTOConfig` union (`JavaAttribute.objectType`)
            // doesn't enumerate. It's correct at runtime (the .NET engine's
            // schema requires 'dotnet'); assert to the declared union so this
            // cross-engine form state still satisfies `DTOConfig`.
            objectType: nativeTypeNamespace(
                framework
            ) as DTOConfig['attributes'][number]['objectType'],
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
})

/**
 * @deprecated kept for backwards compatibility — call `getInitialValues(framework)` instead.
 * Resolves to Spring defaults so legacy consumers stay on the historical behaviour.
 */
export const initialValues: DTOConfig = getInitialValues(ENV_TYPES.SPRING)

export const TabList = [{ label: 'Fields', value: 'attributes' }]

export const TemplateOptions = [
    { label: 'Default', value: 'classic' },
    { label: 'Record', value: 'record' }
]

export const KIND_OPTIONS: { label: string; value: DTOConfig['type'] }[] = [
    { label: 'Data Transfer Object', value: 'dto' },
    { label: 'GraphQL Type', value: 'graphqlType' },
    { label: 'GraphQL Input', value: 'graphqlInput' }
]

export const getTablesColumns = ({
    selectors,
    dto,
    models,
    enums,
    current,
    framework,
    t
}: {
    selectors: any
    dto: any
    models: any
    enums: any
    current: any
    framework: ENV_TYPES
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

    const dtos = getOptionsByObject(dto, module, currentDto)

    const namespacesOptions: SchemaTypeItem[] = [
        { label: t('dto'), value: 'dto', items: dtos },
        {
            label: t('model'),
            value: 'model',
            items: getOptionsByObject(models, module, currentDto)
        },
        { label: t('dataTypes'), value: nativeTypeNamespace(framework), items: dataTypes },
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
