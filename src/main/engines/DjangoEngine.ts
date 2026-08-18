// engines/DjangoEngine.ts
import {
    addBaseApi,
    addController,
    addDTO,
    addEnum,
    addGraphQLSchema,
    addModel,
    addModule,
    addPermission,
    addResponse,
    deleteElement,
    serializeElement as createElement
} from '@igrp/django-engine'
import type {
    BaseApiConfig,
    ModelConfig
} from '@igrp/django-engine/types'
import { readFileSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { ensureDirectoryExists } from '../helpers'
import type { BaseEngine } from '../interfaces'
import type { DjangoConfigData, ProjectData } from '../types'

// The installed Django package publishes the operation functions but its
// declaration bundle does not yet export the corresponding adapter shapes.
// Keep the IPC boundary permissive until that package declaration surface is
// corrected; the engine itself validates each payload at runtime.
type DjangoEngineElementConfig = Record<string, any>

/**
 * Normalize the shared Studio DTO form to the Django engine's strict native
 * contract. The renderer uses `attributes`; Django deliberately accepts only
 * `fields` and rejects UI-only keys through AJV.
 */
const normalizeDjangoDtoConfig = (config: DjangoEngineElementConfig): Record<string, any> => ({
    type: config.type,
    name: config.name,
    module: config.module,
    fields: config.fields ?? config.attributes
})

const jsonSchemaFieldType = (field: Record<string, any>): string => {
    if (Array.isArray(field.enum)) return 'enum'
    if (field.format === 'date-time') return 'datetime'
    if (field.format === 'date') return 'date'
    if (field.format === 'email') return 'email'
    if (field.format === 'uri' || field.format === 'url') return 'url'
    if (field.format === 'uuid') return 'uuid'
    switch (field.type) {
        case 'integer':
            return 'integer'
        case 'number':
            return 'decimal'
        case 'boolean':
            return 'boolean'
        case 'object':
        case 'array':
            return 'json'
        default:
            return 'string'
    }
}

/** Translate the shared response editor's JSON schema into Django fields. */
const normalizeDjangoResponseConfig = (config: DjangoEngineElementConfig): Record<string, any> => {
    const schema = config.content?.['application/json']?.schema as Record<string, any> | undefined
    const properties = schema?.properties && typeof schema.properties === 'object' ? schema.properties : {}
    const required = new Set(Array.isArray(schema?.required) ? schema.required : [])
    const fields = Array.isArray(config.fields)
        ? config.fields
        : Object.entries(properties).map(([name, rawField]) => {
              const field = (rawField || {}) as Record<string, any>
              const normalized: Record<string, any> = {
                  name,
                  type: jsonSchemaFieldType(field),
                  nullable: field.nullable ?? !required.has(name)
              }
              if (Array.isArray(field.enum)) normalized.enumValues = field.enum.filter((value: unknown) => typeof value === 'string')
              if (field.maxLength !== undefined) normalized.maxLength = field.maxLength
              if (field.minLength !== undefined) normalized.minLength = field.minLength
              if (field.pattern !== undefined) normalized.regex = field.pattern
              if (field.default !== undefined) normalized.defaultValue = field.default
              if (field.description !== undefined) normalized.description = field.description
              return normalized
          })
    const numericStatus = Number(config.statusCode)
    return {
        type: 'response',
        name: config.name,
        module: config.module,
        statusCode: Number.isInteger(numericStatus) && numericStatus >= 100 && numericStatus <= 599 ? numericStatus : 200,
        fields
    }
}

/**
 * Resolve the INSTALLED `@igrp/django-engine` version at runtime so the
 * `BaseApiConfig.igrpCoreVersion` persisted to `.igrpstudio/baseApi.json`
 * tracks the engine package actually in use. Previously this was hardcoded to
 * `'0.1.0-alpha.1'`, which silently went stale when the engine was bumped
 * (package is now alpha.2). Resolves the package's main entry (permitted by the
 * engine's `exports` map, unlike a direct `package.json` import) and walks up to
 * its own `package.json`; falls back to the last-known version if resolution
 * fails under unusual packaging.
 */
const DJANGO_ENGINE_FALLBACK_VERSION = '0.1.0-alpha.9'
const resolveDjangoEngineVersion = (): string => {
    try {
        let dir = dirname(require.resolve('@igrp/django-engine'))
        for (let i = 0; i < 6; i++) {
            try {
                const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'))
                if (pkg?.name === '@igrp/django-engine' && typeof pkg.version === 'string') {
                    return pkg.version
                }
            } catch {
                // package.json not at this level — keep walking up
            }
            const parent = dirname(dir)
            if (parent === dir) break
            dir = parent
        }
    } catch {
        // require.resolve failed (unusual packaging) — fall through to fallback
    }
    return DJANGO_ENGINE_FALLBACK_VERSION
}

const deriveApiName = (artifact: string, name?: string): string => {
    const candidates = [name, artifact]
    for (const candidate of candidates) {
        if (!candidate) continue
        const cleaned = candidate.replace(/[^A-Za-z0-9_]/g, '')
        if (cleaned && /^[A-Za-z]/.test(cleaned)) return cleaned
    }
    throw new Error(
        `Cannot derive apiName from artifact "${artifact}". The artifact must contain at least one letter at the start.`
    )
}

/** Translate the shared action-editor shape to Django's native controller contract. */
const normalizeDjangoControllerConfig = (
    config: DjangoEngineElementConfig
): Record<string, any> => {
    const methods = Array.from(
        new Set(
            (Array.isArray(config.actions) ? config.actions : [])
                .map((action: Record<string, any>) => action?.method)
                .filter((method: unknown): method is string =>
                    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method as string)
                )
        )
    )

    return {
        type: 'controller',
        name: config.name,
        module: config.module,
        path: config.basePath ?? config.path,
        methods: methods.length > 0 ? methods : ['GET']
    }
}

/** Preserve the full shared action-editor contract alongside Django's native output. */
const persistDjangoControllerManifest = async (
    config: DjangoEngineElementConfig,
    basePath: string
): Promise<void> => {
    const urlPath = String(config.basePath ?? config.path ?? config.name).replace(/^\/+|\/+$/g, '')
    const configuredActions = Array.isArray(config.actions) ? config.actions : []
    const methods = Array.from(
        new Set(
            configuredActions
                .map((action: Record<string, any>) => action?.method)
                .filter((method: unknown): method is string => typeof method === 'string')
        )
    )
    const actions =
        configuredActions.length > 0
            ? configuredActions.map((action: Record<string, any>) => ({
                  ...action,
                  actionName:
                      action.actionName ??
                      `${String(config.name)
                          .replace(/[^A-Za-z0-9_]/g, '')
                          .replace(/^([^A-Za-z])/, '_$1')}${String(action.method ?? 'GET').toLowerCase()}`,
                  path: action.path ?? `/${urlPath}`,
                  method: action.method ?? 'GET',
                  requestParams: action.requestParams ?? [],
                  pathVariables: action.pathVariables ?? [],
                  headers: action.headers ?? [],
                  responses: action.responses ?? {},
                  roles: action.roles ?? []
              }))
            : methods.map((method) => ({
                  actionName: `${String(config.name).replace(/[^A-Za-z0-9_]/g, '')}${method.toLowerCase()}`,
                  path: `/${urlPath}`,
                  method,
                  requestParams: [],
                  pathVariables: [],
                  headers: [],
                  responses: {},
                  roles: []
              }))

    const manifest = {
        type: 'controller',
        name: config.name,
        module: config.module,
        description: config.description ?? '',
        basePath: `/${urlPath}`,
        actions,
        ...(typeof config.id === 'string' && config.id ? { id: config.id } : {})
    }
    const manifestPath = join(
        basePath,
        '.igrpstudio',
        String(config.module),
        'controller',
        `${String(config.name)}.json`
    )
    await mkdir(dirname(manifestPath), { recursive: true })
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8')
}

export class DjangoEngine implements BaseEngine {
    async registry(): Promise<void> {
        // Template resolution is handled by the constants.ts candidate list
        // inside @igrp/django-engine — no environment toggle needed here.
    }

    async createProject(project: ProjectData, basePath: string): Promise<void> {
        const config = project.config as DjangoConfigData

        const baseConfig: BaseApiConfig = {
            type: 'django',
            apiName: deriveApiName(config.artifact, config.name),
            artifact: config.artifact,
            database: config.database,
            description: config.description,
            projectStructureStyle: config.projectStructureStyle,
            enableObservability: !!config.enableObservability,
            enableEntityRevision: !!config.enableEntityRevision,
            enableGraphQL: !!config.enableGraphQL,
            ...(config.authMode ? { authMode: config.authMode } : {}),
            igrpCoreVersion: resolveDjangoEngineVersion()
        }

        await ensureDirectoryExists(basePath)
        await addBaseApi(baseConfig, basePath)
    }

    async createModel(config: ModelConfig, basePath: string): Promise<void> {
        // The shared Horizon model form keeps this UI-only flag for the
        // Spring/.NET revision controls. Django's model schema is strict and
        // deliberately rejects unknown attribute keys, so remove the flag at
        // the adapter boundary instead of weakening the engine contract.
        const {
            // These collections are part of the shared Studio editor state;
            // Django derives indexes/unique constraints from attributes and
            // its strict model contract does not accept the editor metadata.
            indexes: _indexes,
            uniqueConstraints: _uniqueConstraints,
            primaryKey: _primaryKey,
            id: _id,
            ...engineConfig
        } = config as ModelConfig & {
            indexes?: unknown
            uniqueConstraints?: unknown
            primaryKey?: unknown
            id?: unknown
        }
        const normalizedConfig: ModelConfig = {
            ...engineConfig,
            attributes: config.attributes.map((attribute) => {
                const { skipFieldRevision: _skipFieldRevision, ...djangoAttribute } =
                    attribute as typeof attribute & { skipFieldRevision?: boolean }
                return djangoAttribute
            })
        }

        await addModel(normalizedConfig, basePath)
    }

    /**
     * Selector universe for the API Designer. `@igrp/django-engine` publishes
     * no `engineTypes` export (unlike the Spring/.NET packages), and the
     * FETCH_SELECTORS handler resolves `engine.engineTypes?.(...)` — an absent
     * method returns `undefined`, which crashes the Model editor's
     * `selectors.find(...)` before the user can type anything. Publish the
     * static universe here instead.
     *
     * ATTRIBUTE_TYPES mirrors the `Attribute.type` enum accepted by the
     * engine's AJV model schema (dist/schema/modelConfig). GENERATION_TYPES is
     * empty on purpose: Django PKs are AutoField, and the engine accepts an
     * absent/empty generationType. The remaining keys exist so the (Django-
     * unsupported) DTO/Controller editors degrade to empty dropdowns instead
     * of crashing — saving there still fail-clears via notSupported().
     */
    async engineTypes(_module: string, _basePath: string): Promise<Array<Record<string, any>>> {
        return [
            {
                ATTRIBUTE_TYPES: [
                    'string',
                    'text',
                    'integer',
                    'long',
                    'decimal',
                    'boolean',
                    'date',
                    'datetime',
                    'timestamp',
                    'email',
                    'url',
                    'uuid',
                    'file',
                    'binary',
                    'json'
                ]
            },
            { GENERATION_TYPES: [] },
            { RELATIONSHIP_TYPES: ['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany'] },
            { MYME_TYPES: ['application/json', 'multipart/form-data'] },
            {
                SCHEMA_TYPES: [
                    'Reference other Object',
                    'string',
                    'integer',
                    'boolean',
                    'array',
                    'object',
                    'number',
                    'null',
                    'any'
                ]
            },
            { COLLECTION_TYPES: ['none', 'single', 'list', 'paginated'] },
            { METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }
        ]
    }

    /**
     * Forward the API Designer operations supported by `@igrp/django-engine`.
     * The IPC handlers invoke most operations via optional chaining, so keeping
     * these methods present is important: a missing method would silently
     * resolve and make the renderer believe the artifact was generated.
     * Payload validation remains in the engine package and is allowed to fail
     * clearly at this boundary.
     */
    async createModule(config: DjangoEngineElementConfig, basePath: string): Promise<void> {
        await addModule(config as any, basePath)
    }

    async createDto(config: DjangoEngineElementConfig, basePath: string): Promise<void> {
        await addDTO(normalizeDjangoDtoConfig(config) as any, basePath)
    }

    async createEnum(config: DjangoEngineElementConfig, basePath: string): Promise<void> {
        // The shared Studio enum form stores each row as
        // `{ name, attributes: [code, description] }`; the Django adapter and
        // engine preserve that rich shape in the generated TextChoices class
        // and its .igrpstudio manifest. `id` is editor state, not engine data.
        const { id: _id, ...enumConfig } = config
        await addEnum(enumConfig as any, basePath)
    }

    async createController(config: DjangoEngineElementConfig, basePath: string): Promise<void> {
        await addController(normalizeDjangoControllerConfig(config) as any, basePath)
        await persistDjangoControllerManifest(config, basePath)
    }

    async createResponse(config: DjangoEngineElementConfig, basePath: string): Promise<void> {
        await addResponse(normalizeDjangoResponseConfig(config) as any, basePath)
    }

    async createGraphqlSchema(config: any, basePath: string): Promise<void> {
        await addGraphQLSchema(config, basePath)
    }

    async createPermission(config: DjangoEngineElementConfig, basePath: string): Promise<void> {
        await addPermission(config as any, basePath)
    }

    async serializeElement(config: DjangoEngineElementConfig, basePath: string): Promise<void> {
        await createElement(config as any, basePath)
    }

    async delete(config: DjangoEngineElementConfig, basePath: string): Promise<void> {
        await deleteElement(config as any, basePath)
    }

    async duplicate(config: any, basePath: string): Promise<void> {
        const { name, type, module, content } = config
        const duplicateName = `${name}Copy`
        const duplicateContent = JSON.parse(JSON.stringify(content))
        duplicateContent.name = duplicateName
        duplicateContent.id = `${duplicateContent.id ?? name}_copy`

        switch (type) {
            case 'model':
                await this.createModel({ ...duplicateContent, module }, basePath)
                break
            case 'dto':
                await this.createDto({ ...duplicateContent, module }, basePath)
                break
            case 'enum':
                await addEnum({ ...duplicateContent, module }, basePath)
                break
            case 'controller':
                await addController({ ...duplicateContent, module }, basePath)
                break
            case 'response':
                await this.createResponse({ ...duplicateContent, module }, basePath)
                break
            default:
                throw new Error(`Unsupported type for duplication: ${type}`)
        }
    }
}
