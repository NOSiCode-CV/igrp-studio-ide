import { DTOConfig } from "@igrp/spring-engine/dist/interfaces/types"
import { formatMethods } from "../../helpers"
import { IColumnsTabelProps } from "../../types/Interfaces"
import { OPTION_TYPE } from "@renderer/constants/appConstants"

export const initialValues: DTOConfig = {
    type: 'dto',
    module: '',
    name: '',
    template: "classic",
    attributes: [
        {
            name: '',
            ns: 'java',
            type: 'String',
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

export const NamespacesOptions = [
    { label: 'DTO', value: 'dto' },
    { label: 'Model', value: 'models' },
    { label: 'Java', value: 'java' }
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

    const getUpdatedTypesForNamespace = (selectedValue) => {
        if (selectedValue === OPTION_TYPE.DATA_OBJECTS) return getOptions(dto)

        if (selectedValue === OPTION_TYPE.MODELS) return getOptions(models)

        return paramsTypesData
    }

    return {
        attributes: [
            { key: 'name', name: 'Name', type: 'text'},
            { key: 'ns', name: 'Namespace', type: 'select', options: NamespacesOptions},
            {
                key: 'type',
                name: 'Type',
                type: 'select',
                options: paramsTypesData,
                dependsOn: 'ns',
                getOptions: (selectedValue) => getUpdatedTypesForNamespace(selectedValue),
            },
            {
                key: 'group', name: '', type: 'group', items: [
                    { key: 'advanced', name: '', type: 'popoverDto', options: collectionTypes }
                ]
            }
        ]
    }
}