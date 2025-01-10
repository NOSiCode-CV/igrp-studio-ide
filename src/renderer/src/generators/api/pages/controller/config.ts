import { formatMethods } from "../../helpers"
import { IColumnsTabelProps } from "../../types/Interfaces"

export const initialValues = {
    actionName: '',
    path: '',
    method: 'GET',
    requestBody: "",
    response: 'Object',
    responses: {
        '200': {
            description: "OK",
            content: {
                "application/json": {
                    schema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: "Is Description" },
                            age: { type: 'integer', description: "" },
                            address: {
                                type: 'object',
                                description: "",
                                properties: {
                                    street: { type: 'string', description: "" },
                                    city: { type: 'string', description: "" },
                                },
                            },
                        },
                    }
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

export const getTablesColumns = (selectors: any): { [value: string]: IColumnsTabelProps[] } => {
    const headersTypes = formatMethods(
        (
            selectors.find((selector) => 'HTTP_HEADER_TYPES' in selector) as
            | { HTTP_HEADER_TYPES: string[] }
            | undefined
        )?.HTTP_HEADER_TYPES || []
    )

    // const requestBodyData = formatMethods(
    //     (
    //         selectors.find((selector) => 'BODY_REQUEST' in selector) as
    //         | { BODY_REQUEST: string[] }
    //         | undefined
    //     )?.BODY_REQUEST || []
    // )

    // const typesData = formatMethods(
    //     (selectors.find((selector) => 'MYME_TYPES' in selector) as { MYME_TYPES: string[] } | undefined)
    //         ?.MYME_TYPES || []
    // )

    // const responseTypesData = formatMethods(
    //     (
    //         selectors.find((selector) => 'RESPONSE_TYPES' in selector) as
    //         | { RESPONSE_TYPES: string[] }
    //         | undefined
    //     )?.RESPONSE_TYPES || []
    // )

    const paramsTypesData = formatMethods(
        (
            selectors.find((selector) => 'REQUEST_PARAMS' in selector) as
            | { REQUEST_PARAMS: string[] }
            | undefined
        )?.REQUEST_PARAMS || []
    )
    return {
        requestParams: [
            { key: 'name', name: 'Name', type: 'text' },
            { key: 'value', name: 'Value', type: 'text' },
            {
                key: 'type',
                name: 'Type',
                type: 'select',
                options: paramsTypesData,
            },
            {
                key: 'group', name: '', type: 'group', items: [
                    { key: 'isRequired', name: 'Is Required?', type: 'checkbox', width: '25%' },
                    { key: 'advanced', name: '', type: 'popoverController', width: '25%' }
                ]
            }
        ],
        pathVariables: [
            { key: 'name', name: 'Name', type: 'text' },
            { key: 'value', name: 'Value', type: 'text', },
            {
                key: 'type',
                name: 'Type',
                type: 'select',
                options: paramsTypesData,
            },
            {
                key: 'group', name: '', type: 'group', items: [

                    { key: 'isRequired', name: 'Is Required?', type: 'checkbox', width: '25%' },
                    { key: 'advanced', name: '', type: 'popoverController', width: '25%' }
                ]
            }
        ],
        headers: [
            { key: 'header', name: 'Header', type: 'select', options: headersTypes, width: '25%' },
            { key: 'value', name: 'Value', type: 'text', width: '25%' },
            { key: 'type', name: 'Type', type: 'select', options: paramsTypesData, width: '25%' },
            {
                key: 'group', name: '', type: 'group', items: [

                    { key: 'isRequired', name: 'Is Required?', type: 'checkbox', width: '25%' },
                    { key: 'advanced', name: '', type: 'popoverController', width: '25%' }
                ]
            }
        ],
        requestBody: [
            { key: 'name', name: 'Name', type: 'text', width: '25%' },
            { key: 'value', name: 'Value', type: 'text', width: '25%' },
            { key: 'type', name: 'Type', type: 'select', options: paramsTypesData, width: '25%' },
            {
                key: 'group', name: '', type: 'group', items: [
                    { key: 'isRequired', name: 'Is Required?', type: 'checkbox', width: '25%' },
                    { key: 'advanced', name: '', type: 'popoverController', width: '25%' }
                ]
            }
        ],
    }
}