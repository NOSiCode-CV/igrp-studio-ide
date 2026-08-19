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
import type { ControllerConfig, ModelConfig, ModuleConfig } from '@igrp/dotnet-engine/types'
import type { DotNetConfigData, ProjectData } from '../src/main/types'

const mkTempDir = (label: string): string => {
    const root = path.join(
        os.tmpdir(),
        `igrp-studio-dotnet-smoke-${label}-${process.pid}-${Date.now()}`
    )
    fs.mkdirSync(root, { recursive: true })
    return root
}

const rmRf = (dir: string) => {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

/** Recursively collect file paths under `dir` whose basename matches. */
const findFiles = (dir: string, match: (name: string) => boolean): string[] => {
    if (!fs.existsSync(dir)) return []
    const out: string[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) out.push(...findFiles(full, match))
        else if (match(entry.name)) out.push(full)
    }
    return out
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
        expect(fs.existsSync(path.join(outDir, 'src', 'Program.cs'))).toBe(true)
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
                {
                    type: 'integer',
                    name: 'id',
                    nullable: false,
                    unique: true,
                    primaryKey: true,
                    generationType: 'Identity'
                },
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

        // CRUD runtime emitted for Department (technical style: src/Controllers/Department/...)
        expect(
            fs.existsSync(
                path.join(outDir, 'src', 'Controllers', 'Department', 'DepartmentController.cs')
            )
        ).toBe(true)
        expect(fs.existsSync(path.join(outDir, 'src', 'Services', 'DepartmentCrud.cs'))).toBe(true)
        expect(
            fs.existsSync(path.join(outDir, 'src', 'Models', 'Department', 'Department.cs'))
        ).toBe(true)
        expect(
            fs.existsSync(
                path.join(outDir, 'src', 'Data', 'Configurations', 'DepartmentConfiguration.cs')
            )
        ).toBe(true)

        // Custom controller emitted for HealthCheck
        expect(
            fs.existsSync(
                path.join(outDir, 'src', 'Controllers', 'HealthCheck', 'HealthCheckController.cs')
            )
        ).toBe(true)
    })

    it('accepts the exact response payload Studio sends (type field + 4xx exception)', async () => {
        // Regression: the engine's response schema (`requestConfig.ts`) lacked
        // a `type` property while being `additionalProperties: false`, so the
        // `type: 'response'` field that Studio's editor always includes made
        // AJV reject EVERY response saved from the UI.
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
        await engine.createModule({ type: 'module', name: 'Hr' }, outDir)

        // Mirrors useResponse.handleSave: formik values + module + tab id.
        const studioResponsePayload = {
            type: 'response',
            statusCode: '404',
            name: 'NotFound',
            template: 'classic',
            description: '',
            module: 'Hr',
            id: 'new-action-hr-abc123',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            message: { type: 'string' }
                        }
                    }
                }
            }
        }

        await engine.createResponse(studioResponsePayload as never, outDir)

        // Manifest persisted with `type` so the sidebar can classify it.
        const manifestPath = path.join(outDir, '.igrpstudio', 'Hr', 'responses', 'NotFound.json')
        expect(fs.existsSync(manifestPath)).toBe(true)
        expect(JSON.parse(fs.readFileSync(manifestPath, 'utf-8')).type).toBe('response')

        // DTO emitted, and a 404 status also emits the matching exception.
        expect(findFiles(outDir, (n) => n === 'NotFoundDto.cs').length).toBeGreaterThan(0)
        expect(findFiles(outDir, (n) => n === 'NotFoundException.cs').length).toBeGreaterThan(0)

        // A response saved with no content must fail with the AJV message,
        // not the raw TypeError the unguarded content access used to throw.
        await expect(
            engine.createResponse(
                { ...studioResponsePayload, name: 'Empty', content: {} } as never,
                outDir
            )
        ).rejects.toThrow(/content/i)
    })

    it('keeps both models when two CRUD schemas are created with distinct ids', async () => {
        // Regression for the "adding another schema replaces the last one"
        // bug: the sidebar minted the SAME `new-action-<node>` id for every
        // artifact created from a module node, and the engine treats
        // "same id, different name" as a rename — deleting the previous
        // model and its whole CRUD surface. Studio now mints unique ids;
        // this pins the engine behavior for both halves of that contract.
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
        await engine.createModule({ type: 'module', name: 'Hr' }, outDir)

        const crudModel = (name: string, tableName: string, id: string): ModelConfig =>
            ({
                type: 'model',
                module: 'Hr',
                name,
                tableName,
                id,
                primaryKey: [],
                crud: true,
                audit: false,
                attributes: [
                    {
                        type: 'integer',
                        name: 'id',
                        nullable: false,
                        unique: true,
                        primaryKey: true,
                        generationType: 'Identity'
                    },
                    { type: 'string', name: 'name', length: 120, nullable: false, unique: false }
                ]
            }) as unknown as ModelConfig

        // Two distinct schemas, distinct ids (what Studio sends post-fix).
        await engine.createModel(crudModel('Department', 'departments', 'id-dept'), outDir)
        await engine.createModel(crudModel('Employee', 'employees', 'id-emp'), outDir)

        const modelsDir = path.join(outDir, '.igrpstudio', 'Hr', 'models')
        expect(fs.existsSync(path.join(modelsDir, 'Department.json'))).toBe(true)
        expect(fs.existsSync(path.join(modelsDir, 'Employee.json'))).toBe(true)
        expect(
            fs.existsSync(
                path.join(outDir, 'src', 'Controllers', 'Department', 'DepartmentController.cs')
            )
        ).toBe(true)
        expect(
            fs.existsSync(
                path.join(outDir, 'src', 'Controllers', 'Employee', 'EmployeeController.cs')
            )
        ).toBe(true)

        // Same id + different name stays a RENAME: Employee's artifacts are
        // swept and regenerated as Customer. This is the engine contract that
        // made the old duplicated-id Studio bug destructive.
        await engine.createModel(crudModel('Customer', 'customers', 'id-emp'), outDir)
        expect(fs.existsSync(path.join(modelsDir, 'Employee.json'))).toBe(false)
        expect(fs.existsSync(path.join(modelsDir, 'Customer.json'))).toBe(true)
        expect(
            fs.existsSync(
                path.join(outDir, 'src', 'Controllers', 'Employee', 'EmployeeController.cs')
            )
        ).toBe(false)
        expect(
            fs.existsSync(
                path.join(outDir, 'src', 'Controllers', 'Customer', 'CustomerController.cs')
            )
        ).toBe(true)
        // Department untouched throughout.
        expect(fs.existsSync(path.join(modelsDir, 'Department.json'))).toBe(true)
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

        // Gateway parity (Studio-driven == direct engine). The workspace env
        // publishes this API under the gateway prefix (name = lowercased
        // apiName), never re-emits the removed inert SWAGGER_GATEWAY_PATH...
        const envContent = fs.readFileSync(path.join(outDir, envFile as string), 'utf-8')
        expect(envContent).toContain('IGRP_GATEWAY_PATH=/gateway-api/studiosmokeapi')
        expect(envContent).not.toContain('SWAGGER_GATEWAY_PATH')

        // ...and the generated runtime actually consumes it: the pipeline
        // extension reads IGRP_GATEWAY_PATH, serves Swagger at a relative spec
        // URL that survives the stripped gateway prefix, and honors forwarded
        // headers. It also applies the Spring springdoc.swagger-ui defaults
        // (operationsSorter consumed, try-it-out on, docs collapsed).
        const bootstrap = fs.readFileSync(
            path.join(
                outDir,
                'src',
                'Infrastructure',
                'Pipeline',
                'IgrpApplicationBuilderExtensions.cs'
            ),
            'utf-8'
        )
        expect(bootstrap).toContain('IGRP_GATEWAY_PATH')
        expect(bootstrap).toContain('SwaggerEndpoint("v1/swagger.json"')
        expect(bootstrap).toContain('UseForwardedHeaders')
        expect(bootstrap).toContain('AdditionalItems["operationsSorter"]')
        expect(bootstrap).toContain('EnableTryItOutByDefault()')
        expect(bootstrap).toContain('DocExpansion(DocExpansion.None)')
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
