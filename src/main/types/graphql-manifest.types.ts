export type GraphQLOperationType = 'query' | 'mutation' | 'subscription'

export type GraphQLReturnMode = 'single' | 'list'

export interface GraphQLArgument {
    name: string
    type: string
    required: boolean
    defaultValue?: unknown
    description?: string
}

export interface GraphQLOperation {
    id: string
    operationType: GraphQLOperationType
    name: string
    comment?: string
    args?: GraphQLArgument[]
    inputType?: string
    returnType: string
    returnMode: GraphQLReturnMode
    eventTopic?: string
    enabled?: boolean
}

export interface GraphQLManifest {
    type: 'graphql'
    version: number
    module: string
    operations: GraphQLOperation[]
}
