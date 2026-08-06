import type {
    GraphQLArgument,
    GraphQLManifest,
    GraphQLOperation,
    GraphQLOperationType,
    GraphQLReturnMode
} from '../../types/graphql-manifest.types'
import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import * as path from 'path'
import { randomUUID } from 'crypto'

export interface GraphQLManifestValidationError {
    field: string
    message: string
    code: string
}

function resolveManifestPath(basePath: string, moduleName: string) {
    const manifestDir = path.join(basePath, '.igrpstudio', moduleName, 'graphql')
    const manifestPath = path.join(manifestDir, 'graphql.json')

    return {
        manifestDir,
        manifestPath
    }
}

export function validateManifest(manifest: unknown): GraphQLManifestValidationError[] {
    const errors: GraphQLManifestValidationError[] = []

    const operationTypes: GraphQLOperationType[] = ['query', 'mutation', 'subscription']
    const returnModes: GraphQLReturnMode[] = ['single', 'list']
    const forbiddenFields = ['statusCode', 'headers', 'contentType', 'body']

    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
        return [
            {
                field: 'manifest',
                message: 'Manifest must be an object',
                code: 'invalid_manifest'
            }
        ]
    }

    const manifestRecord = manifest as Record<string, unknown>

    if (manifestRecord.type !== 'graphql') {
        errors.push({
            field: 'type',
            message: 'Manifest type must be "graphql"',
            code: 'invalid_type'
        })
    }

    if (typeof manifestRecord.module !== 'string' || manifestRecord.module.trim().length === 0) {
        errors.push({
            field: 'module',
            message: 'Module is required',
            code: 'missing_module'
        })
    }

    if (!Array.isArray(manifestRecord.operations)) {
        errors.push({
            field: 'operations',
            message: 'Operations must be an array',
            code: 'invalid_operations'
        })

        return errors
    }

    const seenIds = new Set<string>()
    const seenNames = new Set<string>()

    manifestRecord.operations.forEach((operation, operationIndex) => {
        const operationField = `operations[${operationIndex}]`

        if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
            errors.push({
                field: operationField,
                message: 'Operation must be an object',
                code: 'invalid_operation'
            })
            return
        }

        const operationRecord = operation as Record<string, unknown>
        const typedOperation = operationRecord as Partial<GraphQLOperation>

        forbiddenFields.forEach((fieldName) => {
            if (fieldName in operationRecord) {
                errors.push({
                    field: `${operationField}.${fieldName}`,
                    message: `${fieldName} is not supported in GraphQL operations`,
                    code: 'forbidden_rest_field'
                })
            }
        })

        if (typeof typedOperation.id !== 'string' || typedOperation.id.trim().length === 0) {
            errors.push({
                field: `${operationField}.id`,
                message: 'Operation id is required',
                code: 'missing_operation_id'
            })
        } else if (seenIds.has(typedOperation.id)) {
            errors.push({
                field: `${operationField}.id`,
                message: `Duplicate operation id "${typedOperation.id}"`,
                code: 'duplicate_operation_id'
            })
        } else {
            seenIds.add(typedOperation.id)
        }

        if (typeof typedOperation.name !== 'string' || typedOperation.name.trim().length === 0) {
            errors.push({
                field: `${operationField}.name`,
                message: 'Operation name is required',
                code: 'missing_operation_name'
            })
        } else if (seenNames.has(typedOperation.name)) {
            errors.push({
                field: `${operationField}.name`,
                message: `Duplicate operation name "${typedOperation.name}"`,
                code: 'duplicate_operation_name'
            })
        } else {
            seenNames.add(typedOperation.name)
        }

        if (
            typeof typedOperation.operationType !== 'string' ||
            !operationTypes.includes(typedOperation.operationType as GraphQLOperationType)
        ) {
            errors.push({
                field: `${operationField}.operationType`,
                message: 'Operation type must be "query", "mutation", or "subscription"',
                code: 'invalid_operation_type'
            })
        }

        if (
            typeof typedOperation.returnMode !== 'string' ||
            !returnModes.includes(typedOperation.returnMode as GraphQLReturnMode)
        ) {
            errors.push({
                field: `${operationField}.returnMode`,
                message: 'Return mode must be "single" or "list"',
                code: 'invalid_return_mode'
            })
        }

        if (
            typeof typedOperation.returnType !== 'string' ||
            typedOperation.returnType.trim().length === 0
        ) {
            errors.push({
                field: `${operationField}.returnType`,
                message: 'Return type is required',
                code: 'missing_return_type'
            })
        }

        if (
            typedOperation.operationType === 'mutation' &&
            typedOperation.inputType !== undefined &&
            (typeof typedOperation.inputType !== 'string' ||
                typedOperation.inputType.trim().length === 0)
        ) {
            errors.push({
                field: `${operationField}.inputType`,
                message: 'Mutation inputType must be a non-empty string when provided',
                code: 'invalid_input_type'
            })
        }

        if (
            typedOperation.operationType === 'subscription' &&
            (typeof typedOperation.eventTopic !== 'string' ||
                typedOperation.eventTopic.trim().length === 0)
        ) {
            errors.push({
                field: `${operationField}.eventTopic`,
                message: 'Subscription eventTopic is required',
                code: 'missing_event_topic'
            })
        }

        if (typedOperation.args !== undefined) {
            if (!Array.isArray(typedOperation.args)) {
                errors.push({
                    field: `${operationField}.args`,
                    message: 'Arguments must be an array',
                    code: 'invalid_arguments'
                })
                return
            }

            const seenArgumentNames = new Set<string>()

            typedOperation.args.forEach((argument, argumentIndex) => {
                const argumentField = `${operationField}.args[${argumentIndex}]`

                if (!argument || typeof argument !== 'object' || Array.isArray(argument)) {
                    errors.push({
                        field: argumentField,
                        message: 'Argument must be an object',
                        code: 'invalid_argument'
                    })
                    return
                }

                const typedArgument = argument as Partial<GraphQLArgument>

                if (
                    typeof typedArgument.name !== 'string' ||
                    typedArgument.name.trim().length === 0
                ) {
                    errors.push({
                        field: `${argumentField}.name`,
                        message: 'Argument name is required',
                        code: 'missing_argument_name'
                    })
                } else if (seenArgumentNames.has(typedArgument.name)) {
                    errors.push({
                        field: `${argumentField}.name`,
                        message: `Duplicate argument name "${typedArgument.name}"`,
                        code: 'duplicate_argument_name'
                    })
                } else {
                    seenArgumentNames.add(typedArgument.name)
                }

                if (
                    typeof typedArgument.type !== 'string' ||
                    typedArgument.type.trim().length === 0
                ) {
                    errors.push({
                        field: `${argumentField}.type`,
                        message: 'Argument type is required',
                        code: 'missing_argument_type'
                    })
                }

                if (typeof typedArgument.required !== 'boolean') {
                    errors.push({
                        field: `${argumentField}.required`,
                        message: 'Argument required must be a boolean',
                        code: 'invalid_argument_required'
                    })
                }
            })
        }
    })

    return errors
}

export async function loadManifest(basePath: string, moduleName: string): Promise<GraphQLManifest> {
    const { manifestDir, manifestPath } = resolveManifestPath(basePath, moduleName)

    await mkdir(manifestDir, { recursive: true })

    const emptyManifest: GraphQLManifest = {
        type: 'graphql',
        version: 1,
        module: moduleName,
        operations: []
    }

    try {
        const rawContent = await readFile(manifestPath, 'utf-8')
        const manifest = JSON.parse(rawContent) as GraphQLManifest
        const errors = validateManifest(manifest)

        if (errors.length > 0) {
            throw new Error(
                `Invalid GraphQL manifest for module "${moduleName}": ${errors
                    .map((error) => `${error.field}: ${error.message}`)
                    .join('; ')}`
            )
        }

        return manifest
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error
        }
    }

    await saveManifest(basePath, moduleName, emptyManifest)
    return emptyManifest
}

export async function saveManifest(
    basePath: string,
    moduleName: string,
    manifest: GraphQLManifest
): Promise<GraphQLManifest> {
    const errors = validateManifest(manifest)

    if (errors.length > 0) {
        throw new Error(
            `Invalid GraphQL manifest for module "${moduleName}": ${errors
                .map((error) => `${error.field}: ${error.message}`)
                .join('; ')}`
        )
    }

    const { manifestDir, manifestPath } = resolveManifestPath(basePath, moduleName)
    const tempPath = `${manifestPath}.tmp`

    await mkdir(manifestDir, { recursive: true })

    await writeFile(tempPath, JSON.stringify(manifest, null, 2), 'utf-8')
    await rename(tempPath, manifestPath)

    return manifest
}

export async function createOperation(
    basePath: string,
    moduleName: string,
    operation: Omit<GraphQLOperation, 'id'> & { id?: string }
): Promise<GraphQLOperation> {
    const manifest = await loadManifest(basePath, moduleName)
    const newOperation: GraphQLOperation = {
        ...operation,
        id: operation.id?.trim() || randomUUID()
    }

    const updatedManifest: GraphQLManifest = {
        ...manifest,
        operations: [...manifest.operations, newOperation]
    }

    await saveManifest(basePath, moduleName, updatedManifest)

    return newOperation
}

export async function updateOperation(
    basePath: string,
    moduleName: string,
    operationId: string,
    updates: Partial<Omit<GraphQLOperation, 'id'>>
): Promise<GraphQLOperation> {
    const manifest = await loadManifest(basePath, moduleName)
    const operationIndex = manifest.operations.findIndex(
        (operation) => operation.id === operationId
    )

    if (operationIndex === -1) {
        throw new Error(`GraphQL operation "${operationId}" not found`)
    }

    const updatedOperation: GraphQLOperation = {
        ...manifest.operations[operationIndex],
        ...updates,
        id: manifest.operations[operationIndex].id
    }

    const operations = [...manifest.operations]
    operations[operationIndex] = updatedOperation

    const updatedManifest: GraphQLManifest = {
        ...manifest,
        operations
    }

    await saveManifest(basePath, moduleName, updatedManifest)

    return updatedOperation
}

export async function deleteOperation(
    basePath: string,
    moduleName: string,
    operationId: string
): Promise<void> {
    const manifest = await loadManifest(basePath, moduleName)
    const operationExists = manifest.operations.some((operation) => operation.id === operationId)

    if (!operationExists) {
        throw new Error(`GraphQL operation "${operationId}" not found`)
    }

    const updatedManifest: GraphQLManifest = {
        ...manifest,
        operations: manifest.operations.filter((operation) => operation.id !== operationId)
    }

    await saveManifest(basePath, moduleName, updatedManifest)
}

export async function listOperations(
    basePath: string,
    moduleName: string
): Promise<GraphQLOperation[]> {
    const manifest = await loadManifest(basePath, moduleName)
    return manifest.operations
}
