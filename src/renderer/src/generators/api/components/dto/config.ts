import { DTOConfig } from "@igrp/spring-engine/dist/interfaces/types"
import { formatMethods } from "../../helpers"
import { IColumnsTabelProps } from "../Interfaces"

export const initialValues: DTOConfig = {
	type: 'dto',
	name: '',
	template: "classic",
	attributes: [
		{
			name: '',
			ns: 'java',
			type: 'String',
            isList: false
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
    { label: 'Model', value: 'model' },
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

    const getOptions = (selectedValue) => {
        return selectedValue
            .filter(m => m.name !== currentDto)
            .map(item => ({
                label: item.name,
                value: item.name                
            }));
    }

    const getUpdatedTypesForNamespace = (selectedValue) => {

        if (selectedValue === 'dto')
            return getOptions(dto)

        if (selectedValue === 'model')
            return getOptions(models)

        return paramsTypesData
    }

    return {
        attributes: [
            { key: 'name', name: 'Name', type: 'text', width: '40%' },
            {
                key: 'ns',
                name: 'Namespace',
                type: 'select',
                options: NamespacesOptions,
                width: '30%',

            },
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