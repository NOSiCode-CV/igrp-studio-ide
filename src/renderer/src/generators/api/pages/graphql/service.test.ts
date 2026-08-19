import { ENV_TYPES } from '@renderer/constants/appConstants'
import { GraphQLService } from './service'
import type { GraphQLPersistedOperation } from './types'

// Minimal window bridge stub. `service.ts` reads `window.graphql` (manifest
// CRUD) and `window.engine` (generation channel) as globals; node has neither.
type CreateSchemaCall = { config: unknown; engineType: ENV_TYPES; basePath: string }

function stubWindow(ops: GraphQLPersistedOperation[]): CreateSchemaCall[] {
    const created: CreateSchemaCall[] = []
    ;(global as unknown as { window: unknown }).window = {
        graphql: {
            listGraphQLOperations: async () => ops
        },
        engine: {
            createGraphqlSchema: async (
                config: unknown,
                engineType: ENV_TYPES,
                basePath: string
            ) => {
                created.push({ config, engineType, basePath })
            }
        }
    }
    return created
}

const op = (over: Partial<GraphQLPersistedOperation>): GraphQLPersistedOperation => ({
    id: 'id-' + Math.random().toString(36).slice(2),
    operationType: 'mutation',
    name: 'op',
    args: [],
    returnType: 'Boolean',
    returnMode: 'single',
    ...over
})

describe('GraphQLService.generateSchemas — scalar return types', () => {
    // Regression: a module with scalar-return ops (e.g. `deleteAuthor(id):
    // Boolean`, `count: Int`) used to generate NOTHING and surface NO error —
    // the return-type filter dropped every scalar op before
    // `createGraphqlSchema` was ever called. The engine cannot generate a
    // standalone scalar schema (its `typeRef` must resolve to a real
    // graphqlType — verified against @igrp/dotnet-engine), so the correct
    // behavior is to FAIL CLEARLY instead of silently dropping them.
    test('scalar-return ops fail CLEARLY (not silently dropped, no broken synthetic schema)', async () => {
        const scalarOps = (['Boolean', 'Int', 'Float', 'String', 'ID'] as const).map(
            (returnType, index) =>
                op({
                    operationType: index % 2 === 0 ? 'mutation' : 'query',
                    name: `scalarOperation${index}`,
                    returnType
                })
        )
        const created = stubWindow(scalarOps)

        // Rejects with an actionable message naming the offending operation(s)…
        await expect(
            GraphQLService.generateSchemas('/base', 'Blog', ENV_TYPES.DOTNET)
        ).rejects.toThrow(/scalar-return operation/i)

        // …and never pushes a (broken) synthetic scalar schema to the engine.
        expect(created).toHaveLength(0)
    })

    test('object-return ops still generate one schema per return type', async () => {
        const created = stubWindow([
            op({ operationType: 'query', name: 'author', returnType: 'Author' }),
            op({ operationType: 'query', name: 'authors', returnType: 'Author', returnMode: 'list' })
        ])

        await GraphQLService.generateSchemas('/base', 'Blog', ENV_TYPES.DOTNET)

        const authorSchemas = created.filter(
            (c) => (c.config as { name: string }).name === 'Author'
        )
        expect(authorSchemas).toHaveLength(1)
    })
})
