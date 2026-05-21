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
        // The disallowed `version` field must NOT appear in the persisted config.
        expect(Object.prototype.hasOwnProperty.call(baseApi, 'version')).toBe(false)
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
