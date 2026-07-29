// engines/DjangoEngine.ts
import { addBaseApi, addModel } from '@igrp/django-engine'
import type { BaseApiConfig, ModelConfig } from '@igrp/django-engine/types'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { ensureDirectoryExists } from '../helpers'
import type { BaseEngine } from '../interfaces'
import type { DjangoConfigData, ProjectData } from '../types'

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
const DJANGO_ENGINE_FALLBACK_VERSION = '0.1.0-alpha.2'
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
            igrpCoreVersion: resolveDjangoEngineVersion()
        }

        await ensureDirectoryExists(basePath)
        await addBaseApi(baseConfig, basePath)
    }

    async createModel(config: ModelConfig, basePath: string): Promise<void> {
        await addModel(config, basePath)
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
            { SCHEMA_TYPES: [] },
            { COLLECTION_TYPES: [] },
            { METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }
        ]
    }

    /**
     * `@igrp/django-engine` backs only project scaffolding (`addBaseApi` →
     * `createProject`) and model generation (`addModel` → `createModel`). Every
     * other API Designer operation has no Django implementation in the package.
     *
     * The IPC handlers invoke most engine operations via optional chaining
     * (`engine.createDto?.(...)`), so an *absent* method silently no-ops: the
     * handler resolves successfully and the renderer believes the artifact was
     * generated. That silent lie is worse than an error. Implement the
     * unsupported operations as explicit failures instead — `handleWithCustomErrors`
     * turns the throw into `{ error }`, which the API Designer surfaces to the
     * user. (delete/duplicate are required by `BaseEngine`, so they were
     * previously no-op stubs; same fail-clear treatment applies.)
     */
    private notSupported(operation: string): never {
        throw new Error(
            `"${operation}" is not supported for Django projects. @igrp/django-engine ` +
                `generates only the base project (createProject) and models (createModel). ` +
                `This action was blocked instead of silently doing nothing.`
        )
    }

    async createModule(_config: any, _basePath: string): Promise<void> {
        this.notSupported('createModule')
    }

    async createDto(_config: any, _basePath: string): Promise<void> {
        this.notSupported('createDto')
    }

    async createEnum(_config: any, _basePath: string): Promise<void> {
        this.notSupported('createEnum')
    }

    async createController(_config: any, _basePath: string): Promise<void> {
        this.notSupported('createController')
    }

    async createResponse(_config: any, _basePath: string): Promise<void> {
        this.notSupported('createResponse')
    }

    async createGraphqlSchema(_config: any, _basePath: string): Promise<void> {
        this.notSupported('createGraphqlSchema')
    }

    async serializeElement(_config: any, _basePath: string): Promise<void> {
        this.notSupported('serializeElement')
    }

    async delete(_config: any, _basePath: string): Promise<void> {
        this.notSupported('delete')
    }

    async duplicate(_config: any, _basePath: string): Promise<void> {
        this.notSupported('duplicate')
    }
}
