import { DTOConfig } from "@igrp/spring-engine/dist/interfaces/types"
import { formatMethods } from "../../helpers"
import { IColumnsTabelProps } from "../../types/Interfaces"
import { SchemaTypeItem } from "src/main/types"

export const initialValues: DTOConfig = {
    type: 'dto',
    module: '',
    name: '',
    template: "classic",
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

export const TabList = [
    { label: 'Fields', value: 'attributes' },
]

export const TemplateOptions = [
    { label: 'Default', value: 'classic' },
    { label: 'Record', value: 'record' }
]

export const getTablesColumns = ({ selectors, dto, models, currentDto, t }): { [value: string]: IColumnsTabelProps[] } => {

    const paramsTypesData = formatMethods(
        (
            selectors.find((selector) => 'ATTRIBUTE_TYPES' in selector) as
            | { ATTRIBUTE_TYPES: string[] }
            | undefined
        )?.ATTRIBUTE_TYPES || []
    )

    const collectionTypes = formatMethods(
        (
            selectors.find((selector) => 'COLLECTION_TYPES' in selector) as
            | { COLLECTION_TYPES: string[] }
            | undefined
        )?.COLLECTION_TYPES || [],
        true
    )

    const getOptions = (objects) => {
        return objects !== undefined
            ? objects
                .filter((m) => m.name !== currentDto)
                .map((item) => ({
                    value: item.content?.name || item.name,
                    label: item.content?.name || item.name,
                }))
            : []
    }

    const namespacesOptions: SchemaTypeItem[] = [
        { label: t('dto'), value: 'dto', items: getOptions(dto) },
        { label: t('model'), value: 'model', items: getOptions(models) },
        { label: t('dataTypes'), value: 'java', items: paramsTypesData }
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
                key: 'group', name: '', type: 'group', items: [
                    { key: 'advanced', name: '', type: 'popoverDto', options: collectionTypes }
                ]
            }
        ]
    }
}