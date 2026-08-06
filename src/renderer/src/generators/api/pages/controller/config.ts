import { formatMethods } from '../../helpers'
import type { IColumnsTabelProps } from '../../types/Interfaces'

export const initialValues = {
    actionName: '',
    path: '',
    method: 'GET',
    requestBody: undefined,
    responses: {
        '200': {
            description: null,
            name: 'OK',
            content: {
                'application/json': {
                    schema: {
                        type: 'string',
                        objectType: '',
                        name: 'data',
                        collectionType: 'none',
                        module: ''
                    }
                }
            }
        }
    },
    requestParams: [
        {
            type: 'string',
            name: '',
            value: '',
            description: '',
            isRequired: true
        }
    ],
    pathVariables: [],
    headers: [
        {
            type: '',
            header: 'Accept',
            value: '',
            isRequired: true
        }
    ],
    permission: undefined,
    roles: []
}

export const TabList = [
    { label: 'Request', tabId: 'request' },
    { label: 'Response', tabId: 'response' },
    { label: 'Security', tabId: 'security' }
]

export const getTablesColumns = (
    selectors: any,
    enumTypes: any,
    t: any
): { [value: string]: IColumnsTabelProps[] } => {
    const headersTypes = formatMethods(
        (
            selectors.find((selector: any) => 'HTTP_HEADER_TYPES' in selector) as
                | { HTTP_HEADER_TYPES: string[] }
                | undefined
        )?.HTTP_HEADER_TYPES || []
    )

    const paramsTypesData = formatMethods(
        (
            selectors.find((selector: any) => 'REQUEST_PARAMS' in selector) as
                | { REQUEST_PARAMS: string[] }
                | undefined
        )?.REQUEST_PARAMS || []
    )

    const pathVariableTypesData = formatMethods(
        (
            selectors.find((selector: any) => 'PATH_VARIABLE_TYPES' in selector) as
                | { PATH_VARIABLE_TYPES: string[] }
                | undefined
        )?.PATH_VARIABLE_TYPES || []
    )

    const collectionTypesData = formatMethods(
        (
            selectors.find((selector: any) => 'REQUEST_PARAM_COLLECTION_TYPES' in selector) as
                | { REQUEST_PARAM_COLLECTION_TYPES: string[] }
                | undefined
        )?.REQUEST_PARAM_COLLECTION_TYPES || []
    )

    return {
        requestParams: [
            { key: 'name', name: t('name'), type: 'text' },
            { key: 'value', name: t('defaultValue'), type: 'text' },
            {
                key: 'group',
                name: '',
                type: 'group',
                items: [
                    {
                        key: 'type',
                        name: t('type'),
                        type: 'select',
                        options: paramsTypesData
                    },
                    {
                        key: 'isRequired',
                        name: t('isRequired'),
                        type: 'checkbox'
                    },
                    { key: 'advanced', name: '', type: 'popoverController', options: { collectionTypes: collectionTypesData } }
                ]
            },
            { key: 'description', name: t('description'), type: 'text' }
        ],
        pathVariables: [
            { key: 'name', name: t('name'), type: 'text' },
            { key: 'value', name: t('defaultValue'), type: 'text' },
            {
                key: 'group',
                name: '',
                type: 'group',
                items: [
                    {
                        key: 'type',
                        name: t('type'),
                        type: 'select',
                        options: pathVariableTypesData
                    },
                    {
                        key: 'isRequired',
                        name: t('isRequired'),
                        type: 'checkbox'
                    },
                    { key: 'advanced', name: '', type: 'popoverController' }
                ]
            },
            { key: 'description', name: t('description'), type: 'text' }
        ],
        headers: [
            {
                key: 'header',
                name: t('header'),
                type: 'select',
                options: headersTypes
            },
            { key: 'value', name: t('value'), type: 'text' },
            {
                key: 'type',
                name: t('type'),
                type: 'select',
                options: paramsTypesData
            },
            {
                key: 'group',
                name: '',
                type: 'group',
                items: [
                    {
                        key: 'isRequired',
                        name: t('isRequired'),
                        type: 'checkbox'
                    },
                    {
                        key: 'advanced',
                        name: '',
                        type: 'popoverController',
                        options: { enumTypes }
                    }
                ]
            }
        ],
        requestBody: [
            { key: 'name', name: t('name'), type: 'text' },
            { key: 'value', name: t('value'), type: 'text' },
            {
                key: 'type',
                name: t('type'),
                type: 'select',
                options: paramsTypesData
            },
            {
                key: 'group',
                name: '',
                type: 'group',
                items: [
                    {
                        key: 'isRequired',
                        name: t('isRequired'),
                        type: 'checkbox'
                    },
                    { key: 'advanced', name: '', type: 'popoverController' }
                ]
            }
        ]
    }
}
