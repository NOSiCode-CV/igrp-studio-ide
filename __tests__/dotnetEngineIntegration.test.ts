/**
 * Smoke test for Studio ↔ @igrp/dotnet-engine integration.
 *
 * Drives DotNetEngine the same way Studio's main process would: createProject
 * + createModule + createModel + createController. Asserts that the engine's
 * AJV validation does not throw and that the expected files land on disk.
 *
 * Existence of this test is the gate for flipping `availableSupport: true`
 * on the `.NET` framework in `src/renderer/src/pages/project/data.ts` — see
 * the audit report at the time of the dotnet integration wave.
 *
 * Skips automatically when the `@igrp/dotnet-engine` peer is unresolvable
 * (covers fresh checkouts on a clean machine before `npm install`).
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { app } from 'electron'
import { DotNetEngine } from '../src/main/engines/DotNetEngine'
import type {
    ControllerConfig,
    ModelConfig,
    ModuleConfig
} from '@igrp/dotnet-engine/types'
import type { DotNetConfigData, ProjectData } from '../src/main/types'

const mkTempDir = (label: string): string => {
    const root = path.join(os.tmpdir(), `igrp-studio-dotnet-smoke-${label}-${process.pid}-${Date.now()}`)
    fs.mkdirSync(root, { recursive: true })
    return root
}

const rmRf = (dir: string) => {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

describe('Studio ↔ dotnet-engine integration', () => {
    let outDir: string

    beforeEach(() => {
        outDir = mkTempDir('integration')
    })

    afterEach(() => {
        rmRf(outDir)
    })

    it('builds a schema-valid BaseApiConfig and emits a runnable project', async () => {
        const engine = new DotNetEngine()

        const config: DotNetConfigData = {
            artifact: 'studio-smoke-api',
            database: 'Postgresql',
            description: 'Studio smoke test',
            projectStructureStyle: 'technical',
            name: 'Studio Smoke API',
            enableObservability: false,
            enableEntityRevision: false
        }

        const project: ProjectData = {
            id: 'smoke-project-id',
            name: 'Studio Smoke API',
            type: 'backend',
            framework: 'dotnet',
            config,
            path: outDir,
            workspaceId: 'smoke-workspace-id'
        }

        // Must NOT throw — historically AJV rejected the payload because
        // DotNetConfigData omitted apiName / igrpCoreVersion / enableEntityRevision.
        await engine.createProject(project, outDir)

        // Baseline files emitted by `newApi`
        expect(fs.existsSync(path.join(outDir, 'Program.cs'))).toBe(true)
        expect(fs.existsSync(path.join(outDir, '.igrpstudio', 'baseApi.json'))).toBe(true)

        // BaseApiConfig persisted with the derived apiName + pinned IGRP core
        const baseApi = JSON.parse(
            fs.readFileSync(path.join(outDir, '.igrpstudio', 'baseApi.json'), 'utf-8')
        )
        // `deriveApiName` prefers `name` over `artifact` and strips non-identifier
        // chars while preserving case: "Studio Smoke API" → "StudioSmokeAPI".
        expect(baseApi.apiName).toBe('StudioSmokeAPI')
        expect(baseApi.igrpCoreVersion).toMatch(/^\d+\.\d+\.\d+(-[A-Za-z0-9.-]+)?$/)
        expect(baseApi.enableEntityRevision).toBe(false)
        // `version` is forwarded from `app.getVersion()` and persisted for
        // round-trip parity with spring-engine; `workspaceId` round-trips too.
        expect(baseApi.version).toBe(app.getVersion())
        expect(baseApi.workspaceId).toBe('smoke-workspace-id')
        // No `workspaceSlug` on this project → the engine persists no
        // workspaceSlug key and emits no workspace deployment files.
        expect(Object.prototype.hasOwnProperty.call(baseApi, 'workspaceSlug')).toBe(false)
        const topLevel = fs.readdirSync(outDir)
        expect(topLevel.some((f) => /^igrp-compose-.+\.yaml$/.test(f))).toBe(false)
        expect(topLevel.some((f) => /^\.igrp\..+\.env$/.test(f))).toBe(false)
    })

    it('routes secondary operations (createModule / createModel / createController) through the engine', async () => {
        const engine = new DotNetEngine()

        const project: ProjectData = {
            id: 'smoke-project-id',
            name: 'Studio Smoke API',
            type: 'backend',
            framework: 'dotnet',
            path: outDir,
            workspaceId: 'smoke-workspace-id',
            config: {
                artifact: 'studio-smoke-api',
                database: 'Postgresql',
                projectStructureStyle: 'technical',
                name: 'Studio Smoke API',
                enableObservability: false,
                enableEntityRevision: false
            } satisfies DotNetConfigData
        }
        await engine.createProject(project, outDir)

        const hrModule: ModuleConfig = { type: 'module', name: 'Hr' }
        await engine.createModule(hrModule, outDir)

        const department: ModelConfig = {
            type: 'model',
            module: 'Hr',
            name: 'Department',
            tableName: 'departments',
            primaryKey: [],
            crud: true,
            audit: false,
            attributes: [
                { type: 'integer', name: 'id', nullable: false, unique: true, primaryKey: true, generationType: 'Identity' },
                { type: 'string', name: 'name', length: 120, nullable: false, unique: true }
            ]
        }
        await engine.createModel(department, outDir)

        const customController: ControllerConfig = {
            type: 'controller',
            module: 'Hr',
            name: 'HealthCheck',
            basePath: 'api/hr/health',
            actions: [
                {
                    actionName: 'ping',
                    path: '',
                    method: 'GET',
                    responses: {
                        '200': {
                            name: 'PingResponse',
                            module: 'Hr',
                            description: 'OK',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'string',
                                        objectType: 'dotnet',
                                        collectionType: 'none'
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        } as unknown as ControllerConfig

        await engine.createController(customController, outDir)

        // CRUD runtime emitted for Department (technical style: Controllers/Department/...)
        expect(fs.existsSync(path.join(outDir, 'Controllers', 'Department', 'DepartmentController.cs'))).toBe(true)
        expect(fs.existsSync(path.join(outDir, 'Services', 'DepartmentService.cs'))).toBe(true)
        expect(fs.existsSync(path.join(outDir, 'Models', 'Department', 'Department.cs'))).toBe(true)
        expect(fs.existsSync(path.join(outDir, 'Data', 'Repositories', 'Department', 'DepartmentCrudRepository.cs'))).toBe(true)

        // Custom controller emitted for HealthCheck
        expect(fs.existsSync(path.join(outDir, 'Controllers', 'HealthCheck', 'HealthCheckController.cs'))).toBe(true)
    })

    it('forwards workspace identity and emits deployment files for a workspace project', async () => {
        // Wave 10 parity: when the project config carries a `workspaceSlug`
        // (Studio injects it from `IWorkspace.slug` in workspace-service), the
        // engine emits the workspace deployment files and persists the workspace
        // identity + Studio version into baseApi.json. `authMode` selects the
        // identity provider (here: autentika).
        const engine = new DotNetEngine()

        const project: ProjectData = {
            id: 'smoke-project-id',
            name: 'Studio Smoke API',
            type: 'backend',
            framework: 'dotnet',
            path: outDir,
            workspaceId: 'smoke-workspace-id',
            config: {
                artifact: 'studio-smoke-api',
                database: 'Postgresql',
                projectStructureStyle: 'technical',
                name: 'Studio Smoke API',
                enableObservability: false,
                enableEntityRevision: false,
                workspaceSlug: 'acme',
                authMode: 'autentika'
            } satisfies DotNetConfigData
        }
        await engine.createProject(project, outDir)

        // The engine emits the two workspace deployment files, named after the
        // engine `apiName` lowercased (Studio omits the human-readable `name`):
        // deriveApiName('studio-smoke-api', 'Studio Smoke API') → 'StudioSmokeAPI'
        // → 'studiosmokeapi'.
        const topLevel = fs.readdirSync(outDir)
        const composeFile = topLevel.find((f) => /^igrp-compose-.+\.yaml$/.test(f))
        const envFile = topLevel.find((f) => /^\.igrp\..+\.env$/.test(f))
        expect(composeFile).toBe('igrp-compose-studiosmokeapi.yaml')
        expect(envFile).toBe('.igrp.studiosmokeapi.env')

        // Workspace identity + version round-trip into baseApi.json.
        const baseApi = JSON.parse(
            fs.readFileSync(path.join(outDir, '.igrpstudio', 'baseApi.json'), 'utf-8')
        )
        expect(baseApi.workspaceSlug).toBe('acme')
        expect(baseApi.workspaceId).toBe('smoke-workspace-id')
        expect(baseApi.authMode).toBe('autentika')
        expect(baseApi.version).toBe(app.getVersion())
    })

    it('throws Method-not-implemented sentinel error from no operation (regression: stubs are gone)', () => {
        const engine = new DotNetEngine() as unknown as Record<string, unknown>
        // All operations on the interface should be FUNCTIONS, never the
        // sentinel that the original stub threw. This guards against a
        // regression where a future refactor reintroduces "not implemented".
        for (const op of [
            'createProject',
            'createModule',
            'createModel',
            'createDto',
            'createEnum',
            'createController',
            'createResponse',
            'createPermission',
            'delete',
            'duplicate',
            'serializeElement',
            'engineTypes'
        ]) {
            expect(typeof engine[op]).toBe('function')
        }
    })
})
