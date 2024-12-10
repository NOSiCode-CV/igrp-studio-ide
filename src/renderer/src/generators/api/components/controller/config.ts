import { boolean } from "yup"
import { formatMethods } from "../../helpers"
import { IColumnsTabelProps } from "../Interfaces"

export const defaultValues: any = {
    general: {
        actionName: '',
        path: '',
        method: '',
        accepts: '',
        requestBody: '',
        response: ''
    },
    requestParams: {
        type: '',
        name: '',
        required: boolean
    },
    pathVariables: {
        type: '',
        name: '',
        required: boolean
    }
}

export const initialValues = {
    type: 'controller',
    module: '',
    name: '',
    basePath: '',
    actions: [
        {
            general: [
                {
                    actionName: '',
                    path: '',
                    method: '',
                    accepts: '',
                    requestBody: '',
                    response: ''
                }
            ],
            requestParams: [
                {
                    type: 'string',
                    name: '',
                    required: true
                }
            ],
            pathVariables: [
                {
                    type: '',
                    name: '',
                    required: true
                }
            ]
        }
    ]
}

export const TabList = [
    { label: 'General', tabId: 'general' },
    { label: 'Request Params', tabId: 'requestParams' },
    { label: 'Path Variables', tabId: 'pathVariables' }
]

export const getTablesColumns = (selectors: any): { [value: string]: IColumnsTabelProps[] } => {
    const methodsData = formatMethods(
        (selectors.find((selector) => 'METHODS' in selector) as { METHODS: string[] } | undefined)
            ?.METHODS || []
    )

    const requestBodyData = formatMethods(
        (
            selectors.find((selector) => 'BODY_REQUEST' in selector) as
            | { BODY_REQUEST: string[] }
            | undefined
        )?.BODY_REQUEST || []
    )

    const typesData = formatMethods(
        (selectors.find((selector) => 'MYME_TYPES' in selector) as { MYME_TYPES: string[] } | undefined)
            ?.MYME_TYPES || []
    )

    const responseTypesData = formatMethods(
        (
            selectors.find((selector) => 'RESPONSE_TYPES' in selector) as
            | { RESPONSE_TYPES: string[] }
            | undefined
        )?.RESPONSE_TYPES || []
    )

    const paramsTypesData = formatMethods(
        (
            selectors.find((selector) => 'PARAMS_TYPES' in selector) as
            | { PARAMS_TYPES: string[] }
            | undefined
        )?.PARAMS_TYPES || []
    )
    return {
        general: [
            { key: 'actionName', name: 'Action Name', type: 'text', width: '16%' },
            { key: 'path', name: 'Path', type: 'text', width: '16%' },
            { key: 'method', name: 'Method', type: 'select', options: methodsData, width: '16%' },
            { key: 'accepts', name: 'Accepts', type: 'select', options: typesData, width: '16%' },
            {
                key: 'requestBody',
                name: 'Request Body',
                type: 'select',
                options: requestBodyData,
                width: '16%'
            },
            {
                key: 'response',
                name: 'Response Type',
                type: 'select',
                options: responseTypesData,
                width: '16%'
            }
        ],
        requestParams: [
            { key: 'type', name: 'Type', type: 'select', options: paramsTypesData, width: '25%' },
            { key: 'name', name: 'Name', type: 'text', width: '25%' },
            { key: 'required', name: 'Is Required?', type: 'checkbox', width: '25%' }
        ],
        pathVariables: [
            {
                key: 'type',
                name: 'Type',
                type: 'select',
                options: paramsTypesData.filter((param: any) => param.value !== 'Object'),
                width: '25%'
            },
            { key: 'name', name: 'Name', type: 'text', width: '25%' },
            { key: 'required', name: 'Is Required?', type: 'checkbox', width: '25%' }
        ]
    }
}