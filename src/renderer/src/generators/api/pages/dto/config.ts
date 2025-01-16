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
    { label: 'Classic', value: 'classic' },
    { label: 'Record', value: 'record' }
]

export const getTablesColumns = ({ selectors, dto, models, currentDto }): { [value: string]: IColumnsTabelProps[] } => {

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
        )?.COLLECTION_TYPES || []
    )

    const getOptions = (objects) => {
        return objects !== undefined
            ? objects
                .filter((m) => m.name !== currentDto)
                .map((item) => ({
                    label: item.name,
                    value: item.name
                }))
            : []
    }

    const namespacesOptions: SchemaTypeItem[] = [
        { label: 'Data Transfer Object', value: 'dto', items: getOptions(dto) },
        { label: 'Schema', value: 'model', items: getOptions(models) },
        { label: 'Java', value: 'java', items: paramsTypesData }
    ]

    return {
        attributes: [
            { key: 'name', name: 'Name', type: 'text' },
            {
                key: 'type',
                name: 'Type',
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