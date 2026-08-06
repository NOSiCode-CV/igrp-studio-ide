export type GraphQLOperationType = 'query' | 'mutation' | 'subscription'

export type GraphQLReturnMode = 'single' | 'list'

export interface GraphQLArgumentFormValue {
    name: string
    type: string
    required: boolean
    primaryKey?: boolean
    defaultValue?: unknown
    description?: string
}

export interface GraphQLOperationFormValues {
    id?: string
    operationType: GraphQLOperationType
    name: string
    comment?: string
    args: GraphQLArgumentFormValue[]
    inputType?: string
    returnType: string
    returnMode: GraphQLReturnMode
    eventTopic?: string
    enabled?: boolean
}

export interface GraphQLArgumentPayload {
    name: string
    type: string
    required: boolean
    primaryKey?: boolean
    defaultValue?: unknown
    description?: string
}

export interface GraphQLOperationPayload {
    id?: string
    operationType: GraphQLOperationType
    name: string
    comment?: string
    args?: GraphQLArgumentPayload[]
    inputType?: string
    returnType: string
    returnMode: GraphQLReturnMode
    eventTopic?: string
    enabled?: boolean
}

export interface GraphQLPersistedOperation extends Omit<GraphQLOperationPayload, 'id'> {
    id: string
}
