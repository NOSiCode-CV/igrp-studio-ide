import { ipcMain } from 'electron'
import { EVENTS } from '../../constants/events'
import type { GraphQLOperation } from '../../types/graphql-manifest.types'
import {
    createOperation,
    deleteOperation,
    listOperations,
    updateOperation
} from '../../services/graphql/graphql-manifest.service'

export async function createGraphQLOperation(
    basePath: string,
    moduleName: string,
    operation: Omit<GraphQLOperation, 'id'> & { id?: string }
): Promise<GraphQLOperation> {
    return await createOperation(basePath, moduleName, operation)
}

export async function updateGraphQLOperation(
    basePath: string,
    moduleName: string,
    operationId: string,
    updates: Partial<Omit<GraphQLOperation, 'id'>>
): Promise<GraphQLOperation> {
    return await updateOperation(basePath, moduleName, operationId, updates)
}

export async function deleteGraphQLOperation(
    basePath: string,
    moduleName: string,
    operationId: string
): Promise<void> {
    return await deleteOperation(basePath, moduleName, operationId)
}

export async function listGraphQLOperations(
    basePath: string,
    moduleName: string
): Promise<GraphQLOperation[]> {
    return await listOperations(basePath, moduleName)
}

ipcMain.handle(
    EVENTS.GRAPHQL.CREATE_OPERATION,
    async (
        _event,
        basePath: string,
        moduleName: string,
        operation: Omit<GraphQLOperation, 'id'> & { id?: string }
    ) => {
        return await createGraphQLOperation(basePath, moduleName, operation)
    }
)

ipcMain.handle(
    EVENTS.GRAPHQL.UPDATE_OPERATION,
    async (
        _event,
        basePath: string,
        moduleName: string,
        operationId: string,
        updates: Partial<Omit<GraphQLOperation, 'id'>>
    ) => {
        return await updateGraphQLOperation(basePath, moduleName, operationId, updates)
    }
)

ipcMain.handle(
    EVENTS.GRAPHQL.DELETE_OPERATION,
    async (_event, basePath: string, moduleName: string, operationId: string) => {
        return await deleteGraphQLOperation(basePath, moduleName, operationId)
    }
)

ipcMain.handle(EVENTS.GRAPHQL.LIST_OPERATIONS, async (_event, basePath: string, moduleName: string) => {
    return await listGraphQLOperations(basePath, moduleName)
})
