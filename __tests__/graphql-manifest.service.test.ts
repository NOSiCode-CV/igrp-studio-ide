import { access, mkdtemp, readFile, rm } from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import type { GraphQLManifest, GraphQLOperation } from '../src/main/types/graphql-manifest.types'
import {
    createOperation,
    deleteOperation,
    listOperations,
    loadManifest,
    saveManifest,
    updateOperation,
    validateManifest
} from '../src/main/services/graphql/graphql-manifest.service'

function createBaseOperation(
    overrides: Partial<GraphQLOperation> = {}
): GraphQLOperation {
    return {
        id: 'op-1',
        operationType: 'query',
        name: 'getCarro',
        returnType: 'Carro',
        returnMode: 'single',
        ...overrides
    }
}

function createManifest(overrides: Partial<GraphQLManifest> = {}): GraphQLManifest {
    return {
        type: 'graphql',
        version: 1,
        module: 'catalogo',
        operations: [],
        ...overrides
    }
}

describe('graphql manifest service', () => {
    const originalCwd = process.cwd()
    let tempDir: string
    let projectPath: string

    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'igrp-graphql-manifest-'))
        process.chdir(tempDir)
        projectPath = path.join(tempDir, 'project')
    })

    afterEach(async () => {
        process.chdir(originalCwd)
        await rm(tempDir, { recursive: true, force: true })
    })

    describe('manifest creation and persistence', () => {
        it('creates an empty manifest when file does not exist', async () => {
            const manifest = await loadManifest(projectPath, 'catalogo')

            expect(manifest).toEqual(
                createManifest({
                    module: 'catalogo'
                })
            )
        })

        it('creates missing graphql folder automatically', async () => {
            await loadManifest(projectPath, 'catalogo')

            await expect(
                access(path.join(projectPath, '.igrpstudio', 'catalogo', 'graphql', 'graphql.json'))
            ).resolves.toBeUndefined()
        })

        it('saves a valid manifest', async () => {
            const manifest = createManifest({
                operations: [createBaseOperation()]
            })

            await saveManifest(projectPath, 'catalogo', manifest)
            const reloaded = await loadManifest(projectPath, 'catalogo')

            expect(reloaded).toEqual(manifest)
        })

        it('reload returns saved content', async () => {
            const manifest = createManifest({
                operations: [createBaseOperation()]
            })

            await saveManifest(projectPath, 'catalogo', manifest)

            const raw = await readFile(
                path.join(projectPath, '.igrpstudio', 'catalogo', 'graphql', 'graphql.json'),
                'utf-8'
            )

            expect(JSON.parse(raw)).toEqual(manifest)
            await expect(loadManifest(projectPath, 'catalogo')).resolves.toEqual(manifest)
        })

        it('invalid manifest does not overwrite existing valid content', async () => {
            const validManifest = createManifest({
                operations: [createBaseOperation()]
            })

            await saveManifest(projectPath, 'catalogo', validManifest)

            const invalidManifest = createManifest({
                operations: [createBaseOperation({ id: 'op-2', name: '' })]
            })

            await expect(saveManifest(projectPath, 'catalogo', invalidManifest)).rejects.toThrow(
                'Invalid GraphQL manifest'
            )

            await expect(loadManifest(projectPath, 'catalogo')).resolves.toEqual(validManifest)
        })

        it('invalid manifest is not partially written', async () => {
            const validManifest = createManifest({
                operations: [createBaseOperation()]
            })
            const manifestPath = path.join(
                projectPath,
                '.igrpstudio',
                'catalogo',
                'graphql',
                'graphql.json'
            )
            const tempPath = `${manifestPath}.tmp`

            await saveManifest(projectPath, 'catalogo', validManifest)

            const invalidManifest = createManifest({
                operations: [createBaseOperation({ id: '', name: 'broken' })]
            })

            await expect(saveManifest(projectPath, 'catalogo', invalidManifest)).rejects.toThrow()

            const raw = await readFile(manifestPath, 'utf-8')
            expect(JSON.parse(raw)).toEqual(validManifest)
            await expect(access(tempPath)).rejects.toThrow()
        })
    })

    describe('validation', () => {
        it('rejects duplicate operation names', () => {
            const errors = validateManifest(
                createManifest({
                    operations: [
                        createBaseOperation({ id: 'op-1', name: 'duplicate' }),
                        createBaseOperation({ id: 'op-2', name: 'duplicate' })
                    ]
                })
            )

            expect(errors.some((error) => error.code === 'duplicate_operation_name')).toBe(true)
        })

        it('rejects duplicate operation ids', () => {
            const errors = validateManifest(
                createManifest({
                    operations: [
                        createBaseOperation({ id: 'same-id', name: 'one' }),
                        createBaseOperation({ id: 'same-id', name: 'two' })
                    ]
                })
            )

            expect(errors.some((error) => error.code === 'duplicate_operation_id')).toBe(true)
        })

        it('rejects invalid operationType', () => {
            const errors = validateManifest(
                createManifest({
                    operations: [
                        createBaseOperation({
                            operationType: 'invalid' as GraphQLOperation['operationType']
                        })
                    ]
                })
            )

            expect(errors.some((error) => error.code === 'invalid_operation_type')).toBe(true)
        })

        it('rejects invalid returnMode', () => {
            const errors = validateManifest(
                createManifest({
                    operations: [
                        createBaseOperation({
                            returnMode: 'many' as GraphQLOperation['returnMode']
                        })
                    ]
                })
            )

            expect(errors.some((error) => error.code === 'invalid_return_mode')).toBe(true)
        })

        it('rejects missing returnType', () => {
            const errors = validateManifest(
                createManifest({
                    operations: [createBaseOperation({ returnType: '' })]
                })
            )

            expect(errors.some((error) => error.code === 'missing_return_type')).toBe(true)
        })

        it('rejects mutation without inputType', () => {
            const errors = validateManifest(
                createManifest({
                    operations: [
                        createBaseOperation({
                            operationType: 'mutation',
                            inputType: undefined
                        })
                    ]
                })
            )

            expect(errors.some((error) => error.code === 'missing_input_type')).toBe(true)
        })

        it('rejects subscription without eventTopic', () => {
            const errors = validateManifest(
                createManifest({
                    operations: [
                        createBaseOperation({
                            operationType: 'subscription',
                            eventTopic: undefined
                        })
                    ]
                })
            )

            expect(errors.some((error) => error.code === 'missing_event_topic')).toBe(true)
        })

        it('rejects duplicate argument names', () => {
            const errors = validateManifest(
                createManifest({
                    operations: [
                        createBaseOperation({
                            args: [
                                { name: 'id', type: 'ID', required: true },
                                { name: 'id', type: 'String', required: false }
                            ]
                        })
                    ]
                })
            )

            expect(errors.some((error) => error.code === 'duplicate_argument_name')).toBe(true)
        })

        it.each(['statusCode', 'headers', 'contentType', 'body'])(
            'rejects forbidden REST-like field %s',
            (fieldName) => {
                const operation = {
                    ...createBaseOperation(),
                    [fieldName]: fieldName === 'statusCode' ? 200 : {}
                }

                const errors = validateManifest(
                    createManifest({
                        operations: [operation as unknown as GraphQLOperation]
                    })
                )

                expect(errors.some((error) => error.code === 'forbidden_rest_field')).toBe(true)
            }
        )
    })

    describe('crud operations', () => {
        it('creates a valid query operation', async () => {
            const operation = await createOperation(projectPath, 'catalogo', {
                operationType: 'query',
                name: 'getCarro',
                returnType: 'Carro',
                returnMode: 'single'
            })

            expect(operation.id).toBeTruthy()
            expect(operation.operationType).toBe('query')

            const operations = await listOperations(projectPath, 'catalogo')
            expect(operations).toHaveLength(1)
            expect(operations[0]).toEqual(operation)
        })

        it('creates a valid mutation with inputType', async () => {
            const operation = await createOperation(projectPath, 'catalogo', {
                operationType: 'mutation',
                name: 'createCarro',
                inputType: 'CreateCarroInput',
                returnType: 'Carro',
                returnMode: 'single'
            })

            expect(operation.inputType).toBe('CreateCarroInput')
            expect((await listOperations(projectPath, 'catalogo'))).toHaveLength(1)
        })

        it('creates a valid subscription with eventTopic', async () => {
            const operation = await createOperation(projectPath, 'catalogo', {
                operationType: 'subscription',
                name: 'carroCriado',
                eventTopic: 'carro.created',
                returnType: 'Carro',
                returnMode: 'single'
            })

            expect(operation.eventTopic).toBe('carro.created')
            expect((await listOperations(projectPath, 'catalogo'))).toHaveLength(1)
        })

        it('updates an operation by id', async () => {
            const operation = await createOperation(projectPath, 'catalogo', {
                operationType: 'query',
                name: 'getCarro',
                returnType: 'Carro',
                returnMode: 'single'
            })

            const updated = await updateOperation(projectPath, 'catalogo', operation.id, {
                returnMode: 'list',
                comment: 'Updated query'
            })

            expect(updated.id).toBe(operation.id)
            expect(updated.returnMode).toBe('list')
            expect(updated.comment).toBe('Updated query')
        })

        it('deletes an operation by id', async () => {
            const operation = await createOperation(projectPath, 'catalogo', {
                operationType: 'query',
                name: 'getCarro',
                returnType: 'Carro',
                returnMode: 'single'
            })

            await deleteOperation(projectPath, 'catalogo', operation.id)

            await expect(listOperations(projectPath, 'catalogo')).resolves.toEqual([])
        })

        it('preserves id when renaming an operation', async () => {
            const operation = await createOperation(projectPath, 'catalogo', {
                operationType: 'query',
                name: 'getCarro',
                returnType: 'Carro',
                returnMode: 'single'
            })

            const updated = await updateOperation(projectPath, 'catalogo', operation.id, {
                name: 'getCarroById'
            })

            expect(updated.id).toBe(operation.id)
            expect(updated.name).toBe('getCarroById')
        })

        it('lists operations correctly', async () => {
            const first = await createOperation(projectPath, 'catalogo', {
                operationType: 'query',
                name: 'getCarro',
                returnType: 'Carro',
                returnMode: 'single'
            })
            const second = await createOperation(projectPath, 'catalogo', {
                operationType: 'mutation',
                name: 'createCarro',
                inputType: 'CreateCarroInput',
                returnType: 'Carro',
                returnMode: 'single'
            })

            const operations = await listOperations(projectPath, 'catalogo')

            expect(operations).toHaveLength(2)
            expect(operations.map((operation) => operation.id)).toEqual([first.id, second.id])
        })
    })
})
