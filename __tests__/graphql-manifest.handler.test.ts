import type { GraphQLOperation } from '../src/main/types/graphql-manifest.types'

const serviceMock = {
    createOperation: jest.fn(),
    updateOperation: jest.fn(),
    deleteOperation: jest.fn(),
    listOperations: jest.fn()
}

jest.mock('../src/main/services/graphql/graphql-manifest.service', () => serviceMock)

import {
    createGraphQLOperation,
    deleteGraphQLOperation,
    listGraphQLOperations,
    updateGraphQLOperation
} from '../src/main/handlers/graphql/graphql-manifest.handler'

describe('graphql manifest handler', () => {
    const basePath = 'C:/tmp/demo-project'

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('delegates createGraphQLOperation to the service', async () => {
        const operation: GraphQLOperation = {
            id: 'op-1',
            operationType: 'query',
            name: 'getCarro',
            returnType: 'Carro',
            returnMode: 'single'
        }

        serviceMock.createOperation.mockResolvedValue(operation)

        await expect(
            createGraphQLOperation(basePath, 'catalogo', {
                operationType: 'query',
                name: 'getCarro',
                returnType: 'Carro',
                returnMode: 'single'
            })
        ).resolves.toEqual(operation)

        expect(serviceMock.createOperation).toHaveBeenCalledWith(basePath, 'catalogo', {
            operationType: 'query',
            name: 'getCarro',
            returnType: 'Carro',
            returnMode: 'single'
        })
    })

    it('delegates updateGraphQLOperation to the service', async () => {
        const operation: GraphQLOperation = {
            id: 'op-1',
            operationType: 'query',
            name: 'getCarroAtualizado',
            returnType: 'Carro',
            returnMode: 'single'
        }

        serviceMock.updateOperation.mockResolvedValue(operation)

        await expect(
            updateGraphQLOperation(basePath, 'catalogo', 'op-1', { name: 'getCarroAtualizado' })
        ).resolves.toEqual(operation)

        expect(serviceMock.updateOperation).toHaveBeenCalledWith(basePath, 'catalogo', 'op-1', {
            name: 'getCarroAtualizado'
        })
    })

        it('delegates deleteGraphQLOperation to the service', async () => {
        serviceMock.deleteOperation.mockResolvedValue(undefined)

        await expect(deleteGraphQLOperation(basePath, 'catalogo', 'op-1')).resolves.toBeUndefined()

        expect(serviceMock.deleteOperation).toHaveBeenCalledWith(basePath, 'catalogo', 'op-1')
    })

    it('delegates listGraphQLOperations to the service', async () => {
        const operations: GraphQLOperation[] = [
            {
                id: 'op-1',
                operationType: 'query',
                name: 'getCarro',
                returnType: 'Carro',
                returnMode: 'single'
            }
        ]

        serviceMock.listOperations.mockResolvedValue(operations)

        await expect(listGraphQLOperations(basePath, 'catalogo')).resolves.toEqual(operations)

        expect(serviceMock.listOperations).toHaveBeenCalledWith(basePath, 'catalogo')
    })
})
