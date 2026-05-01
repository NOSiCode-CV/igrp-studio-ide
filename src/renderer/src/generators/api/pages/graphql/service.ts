import { ENV_TYPES } from '@renderer/constants/appConstants'
import { toGraphQLOperationPayload } from './mapper'
import type { GraphQLOperationFormValues, GraphQLPersistedOperation } from './types'

const PRIMITIVES = new Set(['Boolean', 'String', 'Int', 'Float', 'ID'])

function buildSchemaConfig(moduleName: string, schemaName: string, ops: GraphQLPersistedOperation[]) {
    const queries: object[] = []
    const mutations: object[] = []
    const inputRefs = new Set<string>()

    for (const op of ops) {
        if (op.operationType === 'subscription') continue
        const collectionType = op.returnMode === 'list' ? 'list' : 'single'
        const returnPart = PRIMITIVES.has(op.returnType)
            ? { returnType: op.returnType, collectionType }
            : { returnTypeRef: op.returnType, collectionType }
        const argsPart =
            op.args && op.args.length > 0
                ? {
                      args: op.args.map((a) => ({
                          name: a.name,
                          type: a.type,
                          nullable: !a.required,
                          ...(a.description ? { description: a.description } : {})
                      }))
                  }
                : {}

        if (op.operationType === 'query') {
            queries.push({ name: op.name, ...argsPart, ...returnPart })
        } else if (op.operationType === 'mutation') {
            mutations.push({
                name: op.name,
                ...(op.inputType ? { inputRef: op.inputType } : {}),
                ...argsPart,
                ...returnPart
            })
            if (op.inputType && !PRIMITIVES.has(op.inputType)) inputRefs.add(op.inputType)
        }
    }

    return {
        type: 'graphql' as const,
        name: schemaName,
        module: moduleName,
        typeRef: schemaName,
        ...(inputRefs.size > 0 ? { inputRefs: Array.from(inputRefs) } : {}),
        ...(queries.length > 0 ? { queries } : {}),
        ...(mutations.length > 0 ? { mutations } : {})
    }
}

async function persistSchemaToEngine(
    basePath: string,
    moduleName: string,
    schemaName: string
): Promise<void> {
    if (PRIMITIVES.has(schemaName)) return
    const allOps = await window.graphql.listGraphQLOperations(basePath, moduleName)
    const schemaOps = allOps.filter((op) => op.returnType === schemaName)
    const config = buildSchemaConfig(moduleName, schemaName, schemaOps)
    console.log('[GraphQL] createGraphqlSchema config:', JSON.stringify(config, null, 2))
    console.log('[GraphQL] basePath:', basePath)
    const result = await window.engine.createGraphqlSchema(config, ENV_TYPES.SPRING, basePath)
    console.log('[GraphQL] createGraphqlSchema result:', result)
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
            await persistSchemaToEngine(basePath, moduleName, payload.returnType)
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
            await persistSchemaToEngine(basePath, moduleName, payload.returnType)
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
            await persistSchemaToEngine(basePath, moduleName, target.returnType)
        }
    },

    async listGraphQLOperations(
        basePath: string,
        moduleName: string
    ): Promise<GraphQLPersistedOperation[]> {
        return await window.graphql.listGraphQLOperations(basePath, moduleName)
    }
}
