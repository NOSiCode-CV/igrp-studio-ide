import { toGraphQLOperationPayload } from './mapper'
import type { GraphQLOperationFormValues, GraphQLPersistedOperation } from './types'

export const GraphQLService = {
    async createGraphQLOperation(
        basePath: string,
        moduleName: string,
        values: GraphQLOperationFormValues
    ): Promise<GraphQLPersistedOperation> {
        const payload = toGraphQLOperationPayload({
            ...values,
            id: undefined
        })

        return await window.graphql.createGraphQLOperation(basePath, moduleName, payload)
    },

    async updateGraphQLOperation(
        basePath: string,
        moduleName: string,
        operationId: string,
        values: GraphQLOperationFormValues
    ): Promise<GraphQLPersistedOperation> {
        const payload = toGraphQLOperationPayload({
            ...values,
            id: operationId
        })

        return await window.graphql.updateGraphQLOperation(
            basePath,
            moduleName,
            operationId,
            payload
        )
    },

    async deleteGraphQLOperation(
        basePath: string,
        moduleName: string,
        operationId: string
    ): Promise<void> {
        await window.graphql.deleteGraphQLOperation(basePath, moduleName, operationId)
    },

    async listGraphQLOperations(
        basePath: string,
        moduleName: string
    ): Promise<GraphQLPersistedOperation[]> {
        return await window.graphql.listGraphQLOperations(basePath, moduleName)
    }
}
