import { formatMethods } from "../../helpers/helpers"
import { IColumnsTabelProps } from "../../types/Interfaces"

export const initialValues = {
    actionName: '',
    path: '',
    method: 'GET',
    requestBody: "",
    responses: {
        '200': {
            description: null,
            name: "OK",
            content: {
                "application/json": {
                    schema: null
                }
            }
        },
    },
    requestParams: [
        {
            type: '',
            name: '',
            value: '',
            isRequired: true
        }
    ],
    pathVariables: [
        {
            type: '',
            name: '',
            value: '',
            isRequired: true
        }
    ],
    headers: [
        {
            type: '',
            header: 'Accept',
            value: '',
            isRequired: true
        }
    ]
}

export const TabList = [
    { label: 'Request', tabId: 'request' },
    { label: 'Response', tabId: 'response' }
]

export const getTablesColumns = (selectors: any, enumTypes: any, t: any): { [value: string]: IColumnsTabelProps[] } => {
    const headersTypes = formatMethods(
        (
            selectors.find((selector) => 'HTTP_HEADER_TYPES' in selector) as
            | { HTTP_HEADER_TYPES: string[] }
            | undefined
        )?.HTTP_HEADER_TYPES || []
    )

    const paramsTypesData = formatMethods(
        (
            selectors.find((selector) => 'REQUEST_PARAMS' in selector) as
            | { REQUEST_PARAMS: string[] }
            | undefined
        )?.REQUEST_PARAMS || []
    )

    return {
        requestParams: [
            { key: 'name', name: t('name'), type: 'text' },
            { key: 'value', name: t('value'), type: 'text' },
            {
                key: 'type',
                name: t('type'),
                type: 'select',
                options: paramsTypesData,
            },
            {
                key: 'group', name: '', type: 'group', items: [
                    { key: 'isRequired', name: t('isRequired'), type: 'checkbox', width: '25%' },
                    { key: 'advanced', name: '', type: 'popoverController', width: '25%' }
                ]
            }
        ],
        pathVariables: [
            { key: 'name', name: t('name'), type: 'text' },
            { key: 'value', name: t('value'), type: 'text', },
            {
                key: 'type',
                name: t('type'),
                type: 'select',
                options: paramsTypesData,
            },
            {
                key: 'group', name: '', type: 'group', items: [

                    { key: 'isRequired', name: t('isRequired'), type: 'checkbox', width: '25%' },
                    { key: 'advanced', name: '', type: 'popoverController', width: '25%' }
                ]
            }
        ],
        headers: [
            { key: 'header', name: t('header'), type: 'select', options: headersTypes, width: '25%' },
            { key: 'value', name: t('value'), type: 'text', width: '25%' },
            { key: 'type', name: t('type'), type: 'select', options: paramsTypesData, width: '25%' },
            {
                key: 'group', name: '', type: 'group', items: [

                    { key: 'isRequired', name: t('isRequired'), type: 'checkbox', width: '25%' },
                    { key: 'advanced', name: '', type: 'popoverController', width: '25%', options: { enumTypes } }
                ]
            }
        ],
        requestBody: [
            { key: 'name', name: t('name'), type: 'text', width: '25%' },
            { key: 'value', name: t('value'), type: 'text', width: '25%' },
            { key: 'type', name: t('type'), type: 'select', options: paramsTypesData, width: '25%' },
            {
                key: 'group', name: '', type: 'group', items: [
                    { key: 'isRequired', name: t('isRequired'), type: 'checkbox', width: '25%' },
                    { key: 'advanced', name: '', type: 'popoverController', width: '25%' }
                ]
            }
        ],
    }
}