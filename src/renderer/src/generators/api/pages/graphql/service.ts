import { ENV_TYPES } from '@renderer/constants/appConstants'
import { toGraphQLOperationPayload } from './mapper'
import type { GraphQLOperationFormValues, GraphQLPersistedOperation } from './types'

const PRIMITIVES = new Set(['Boolean', 'String', 'Int', 'Float', 'ID'])

const GQL_TO_ENGINE_TYPE: Record<string, string> = {
    Int: 'integer',
    Float: 'float',
    Boolean: 'boolean',
    String: 'string',
    ID: 'string'
}

function buildSchemaConfig(
    moduleName: string,
    schemaName: string,
    ops: GraphQLPersistedOperation[]
) {
    const queries: object[] = []
    const mutations: object[] = []

    for (const op of ops) {
        if (op.operationType === 'subscription') continue

        const returnObj = PRIMITIVES.has(op.returnType)
            ? {
                  objectType: 'java' as const,
                  type: GQL_TO_ENGINE_TYPE[op.returnType] ?? op.returnType
              }
            : { objectType: 'graphqlType' as const, type: op.returnType }

        const baseParams = (op.args ?? []).map((a) => ({
            name: a.name,
            objectType: (PRIMITIVES.has(a.type) ? 'java' : 'graphqlInput') as
                | 'java'
                | 'graphqlInput',
            type: GQL_TO_ENGINE_TYPE[a.type] ?? a.type,
            required: a.required
        }))

        if (op.operationType === 'query') {
            queries.push({
                name: op.name,
                ...(baseParams.length > 0 ? { params: baseParams } : {}),
                return: returnObj,
                collectionType: op.returnMode === 'list' ? 'list' : 'single'
            })
        } else if (op.operationType === 'mutation') {
            const mutationParams = op.inputType
                ? [
                      {
                          name: 'input',
                          objectType: 'graphqlInput' as const,
                          type: op.inputType,
                          required: true
                      },
                      ...baseParams
                  ]
                : baseParams
            mutations.push({
                name: op.name,
                ...(mutationParams.length > 0 ? { params: mutationParams } : {}),
                return: returnObj
            })
        }
    }

    return {
        type: 'graphql' as const,
        name: schemaName,
        module: moduleName,
        typeRef: schemaName,
        ...(queries.length > 0 ? { queries } : {}),
        ...(mutations.length > 0 ? { mutations } : {})
    }
}

export const GraphQLService = {
    async createGraphQLOperation(
        basePath: string,
        moduleName: string,
        values: GraphQLOperationFormValues
    ): Promise<GraphQLPersistedOperation> {
        const payload = toGraphQLOperationPayload({ ...values, id: undefined })
        const result = await window.graphql.createGraphQLOperation(basePath, moduleName, payload)
        if (payload.operationType !== 'subscription') {
            await GraphQLService.generateSchemas(basePath, moduleName)
        }
        return result
    },

    async updateGraphQLOperation(
        basePath: string,
        moduleName: string,
        operationId: string,
        values: GraphQLOperationFormValues
    ): Promise<GraphQLPersistedOperation> {
        const payload = toGraphQLOperationPayload({ ...values, id: operationId })
        const result = await window.graphql.updateGraphQLOperation(
            basePath,
            moduleName,
            operationId,
            payload
        )
        if (payload.operationType !== 'subscription') {
            await GraphQLService.generateSchemas(basePath, moduleName)
        }
        return result
    },

    async deleteGraphQLOperation(
        basePath: string,
        moduleName: string,
        operationId: string
    ): Promise<void> {
        const allOps = await window.graphql.listGraphQLOperations(basePath, moduleName)
        const target = allOps.find((op) => op.id === operationId)
        await window.graphql.deleteGraphQLOperation(basePath, moduleName, operationId)
        if (target && target.operationType !== 'subscription') {
            await GraphQLService.generateSchemas(basePath, moduleName)
        }
    },

    async generateSchemas(basePath: string, moduleName: string): Promise<void> {
        const allOps = await window.graphql.listGraphQLOperations(basePath, moduleName)
        const uniqueReturnTypes = new Set(
            allOps
                .filter(
                    (op) => op.operationType !== 'subscription' && !PRIMITIVES.has(op.returnType)
                )
                .map((op) => op.returnType)
        )
        for (const schemaName of uniqueReturnTypes) {
            const schemaOps = allOps.filter((op) => op.returnType === schemaName)
            const config = buildSchemaConfig(moduleName, schemaName, schemaOps)
            await window.engine.createGraphqlSchema(config, ENV_TYPES.SPRING, basePath)
        }
    },

    async listGraphQLOperations(
        basePath: string,
        moduleName: string
    ): Promise<GraphQLPersistedOperation[]> {
        return await window.graphql.listGraphQLOperations(basePath, moduleName)
    }
}
