import { DTOConfig } from "@igrp/spring-engine/dist/interfaces/types"
import { formatMethods } from "../../helpers"
import { IColumnsTabelProps } from "../Interfaces"
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

export const defaultValues: any = {
    attributes: {
        name: '',
        ns: 'java',
        type: 'String'
    }
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

    const getOptions = (objects) => {
        return objects !== undefined ? objects
            .filter(m => m.name !== currentDto)
            .map(item => ({
                label: item.name,
                value: item.name
            })) : [];
    }

    const getUpdatedTypesForNamespace = (selectedValue) => {

        if (selectedValue === OPTION_TYPE.DATA_OBJECTS)
            return getOptions(dto)

        if (selectedValue === OPTION_TYPE.MODELS)
            return getOptions(models)

        return paramsTypesData
    }

    return {
        attributes: [
            { key: 'name', name: 'Name', type: 'text', width: '40%' },
            { key: 'ns', name: 'Namespace', type: 'select', options: NamespacesOptions, width: '30%' },
            {
                key: 'type',
                name: 'Type',
                type: 'select',
                options: paramsTypesData,
                width: '20%',
                dependsOn: 'ns',
                getOptions: (selectedValue) => getUpdatedTypesForNamespace(selectedValue),
            },
            { key: 'isList', name: 'Is List', type: 'checkbox' },
        ]
    }
}