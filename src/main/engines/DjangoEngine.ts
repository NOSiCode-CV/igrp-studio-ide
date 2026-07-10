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

    async delete(_config: any, _basePath: string): Promise<void> {
        // Element deletion not yet implemented for Django projects.
    }

    async duplicate(_config: any, _basePath: string): Promise<void> {
        // Element duplication not yet implemented for Django projects.
    }
}
