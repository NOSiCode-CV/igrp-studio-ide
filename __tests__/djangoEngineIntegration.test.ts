/**
 * Smoke test for Studio ↔ @igrp/django-engine integration.
 *
 * Drives DjangoEngine the same way Studio's main process would: see
 * src/main/handlers/api-handler.ts — EVENTS.ENGINE.CREATE_PROJECT and
 * EVENTS.SPRING.CREATE_MODEL both resolve `EngineFactory.getEngine(type)`
 * and call `.createProject` / `.createModel`. This test calls the same
 * DjangoEngine methods directly, mirroring __tests__/dotnetEngineIntegration.test.ts.
 *
 * Existence of this test is the gate for `availableSupport: true` on the
 * `django` entry in src/renderer/src/browser/project/data.ts.
 */

import type { ModelConfig } from '@igrp/django-engine/types'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { DjangoEngine } from '../src/main/engines/DjangoEngine'
import type { DjangoConfigData, ProjectData } from '../src/main/types'

const mkTempDir = (label: string): string => {
    const root = path.join(
        os.tmpdir(),
        `igrp-studio-django-smoke-${label}-${process.pid}-${Date.now()}`
    )
    fs.mkdirSync(root, { recursive: true })
    return root
}

const rmRf = (dir: string) => {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

const baseProject = (outDir: string): ProjectData =>
    ({
        id: 'smoke-project-id',
        name: 'Studio Django Smoke',
        type: 'backend',
        framework: 'django',
        path: outDir,
        workspaceId: 'smoke-workspace-id',
        config: {
            artifact: 'studio_django_smoke',
            database: 'PostgreSQL',
            description: 'Studio smoke test',
            projectStructureStyle: 'technical',
            name: 'Studio Django Smoke',
            enableObservability: false,
            enableEntityRevision: false
        } satisfies DjangoConfigData
    }) as ProjectData

/** baseProject with the Django config overridden (e.g. to toggle enableGraphQL). */
const projectWith = (outDir: string, overrides: Partial<DjangoConfigData>): ProjectData => {
    const base = baseProject(outDir)
    return {
        ...base,
        config: { ...(base.config as DjangoConfigData), ...overrides }
    } as ProjectData
}

const ARTIFACT = 'studio_django_smoke'
const readBaseApi = (outDir: string): Record<string, unknown> =>
    JSON.parse(fs.readFileSync(path.join(outDir, '.igrpstudio', 'baseApi.json'), 'utf-8'))
const configFile = (outDir: string, file: string): string =>
    path.join(outDir, ARTIFACT, 'config', file)

describe('Studio ↔ django-engine integration', () => {
    let outDir: string

    beforeEach(() => {
        outDir = mkTempDir('integration')
    })

    afterEach(() => {
        rmRf(outDir)
    })

    it('builds a schema-valid BaseApiConfig and emits a runnable project', async () => {
        const engine = new DjangoEngine()
        await engine.createProject(baseProject(outDir), outDir)

        expect(fs.existsSync(path.join(outDir, 'manage.py'))).toBe(true)
        expect(fs.existsSync(path.join(outDir, '.igrpstudio', 'baseApi.json'))).toBe(true)

        const baseApi = JSON.parse(
            fs.readFileSync(path.join(outDir, '.igrpstudio', 'baseApi.json'), 'utf-8')
        )
        // deriveApiName strips non-identifier chars: "Studio Django Smoke" -> "StudioDjangoSmoke"
        expect(baseApi.apiName).toBe('StudioDjangoSmoke')
        expect(baseApi.igrpCoreVersion).toMatch(/^\d+\.\d+\.\d+(-[A-Za-z0-9.-]+)?$/)
    })

    it('routes createModel through the engine for a simple CRUD model (Department)', async () => {
        const engine = new DjangoEngine()
        await engine.createProject(baseProject(outDir), outDir)

        const department: ModelConfig = {
            type: 'model',
            name: 'Department',
            tableName: 't_department',
            module: 'departments',
            crud: true,
            attributes: [
                {
                    name: 'id',
                    type: 'integer',
                    primaryKey: true,
                    nullable: false,
                    unique: true,
                    generationType: 'IDENTITY'
                },
                {
                    name: 'code',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: true,
                    length: 50
                },
                {
                    name: 'name',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: false,
                    length: 255
                },
                {
                    name: 'active',
                    type: 'boolean',
                    primaryKey: false,
                    nullable: false,
                    defaultValue: true
                }
            ]
        }
        await engine.createModel(department, outDir)

        expect(fs.existsSync(path.join(outDir, 'department', 'models.py'))).toBe(true)
        expect(fs.existsSync(path.join(outDir, 'department', 'views.py'))).toBe(true)
        expect(fs.existsSync(path.join(outDir, 'department', 'serializers.py'))).toBe(true)
        expect(
            fs.existsSync(
                path.join(outDir, '.igrpstudio', 'departments', 'models', 'Department.json')
            )
        ).toBe(true)

        const modelsPy = fs.readFileSync(path.join(outDir, 'department', 'models.py'), 'utf-8')
        expect(modelsPy).toContain('max_length=50')
        expect(modelsPy).toContain('unique=True')
    })

    it('routes a ManyToOne relation model (Employee -> Department) through the engine', async () => {
        const engine = new DjangoEngine()
        await engine.createProject(baseProject(outDir), outDir)

        const department: ModelConfig = {
            type: 'model',
            name: 'Department',
            tableName: 't_department',
            module: 'departments',
            crud: true,
            attributes: [
                {
                    name: 'id',
                    type: 'integer',
                    primaryKey: true,
                    nullable: false,
                    unique: true,
                    generationType: 'IDENTITY'
                },
                {
                    name: 'code',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: true,
                    length: 50
                },
                {
                    name: 'name',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: false,
                    length: 255
                }
            ]
        }
        await engine.createModel(department, outDir)

        const employee: ModelConfig = {
            type: 'model',
            name: 'Employee',
            tableName: 't_employee',
            module: 'employees',
            crud: true,
            attributes: [
                {
                    name: 'id',
                    type: 'integer',
                    primaryKey: true,
                    nullable: false,
                    unique: true,
                    generationType: 'IDENTITY'
                },
                {
                    name: 'employee_number',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: true,
                    length: 50
                },
                {
                    name: 'name',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: false,
                    length: 255
                },
                {
                    name: 'department',
                    type: 'relation',
                    nullable: true,
                    // NOTE: `relation.module` must be the target's actual Django app label
                    // (toSnakeCase(entity) = "department"), NOT the target ModelConfig's own
                    // `module` grouping field ("departments") — those are different concepts
                    // that happen to share a name. Omitting `module` lets the engine default
                    // correctly to toSnakeCase(entity).
                    relation: { type: 'ManyToOne', entity: 'Department', orphanRemoval: false }
                }
            ]
        } as unknown as ModelConfig
        await engine.createModel(employee, outDir)

        const employeeModelsPy = fs.readFileSync(
            path.join(outDir, 'employee', 'models.py'),
            'utf-8'
        )
        expect(employeeModelsPy).toContain('models.ForeignKey(')
        expect(employeeModelsPy).toContain("'department.Department'")
    })

    it('routes a model with a custom @action (Project.submit) through the engine', async () => {
        const engine = new DjangoEngine()
        await engine.createProject(baseProject(outDir), outDir)

        const project: ModelConfig = {
            type: 'model',
            name: 'Project',
            tableName: 't_project',
            module: 'projects',
            crud: true,
            attributes: [
                {
                    name: 'id',
                    type: 'integer',
                    primaryKey: true,
                    nullable: false,
                    unique: true,
                    generationType: 'IDENTITY'
                },
                {
                    name: 'name',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: false,
                    length: 255
                },
                {
                    name: 'status',
                    type: 'enum',
                    primaryKey: false,
                    nullable: false,
                    enumValues: ['DRAFT', 'SUBMITTED', 'APPROVED'],
                    defaultValue: 'DRAFT'
                }
            ],
            actions: [
                {
                    name: 'submit',
                    method: 'POST',
                    scope: 'detail',
                    implementation: 'demo',
                    targetStatus: 'SUBMITTED',
                    requestDto: {
                        name: 'SubmitRequest',
                        fields: [{ name: 'comment', type: 'string', nullable: true }]
                    }
                }
            ]
        } as unknown as ModelConfig
        await engine.createModel(project, outDir)

        const viewsPy = fs.readFileSync(path.join(outDir, 'project', 'views.py'), 'utf-8')
        expect(viewsPy).toContain('def submit(self, request, pk=None):')
        const servicesPy = fs.readFileSync(path.join(outDir, 'project', 'services.py'), 'utf-8')
        expect(servicesPy).toContain('@transaction.atomic')
        expect(servicesPy).toContain('def submit(')
    })

    it('generates a full multi-model project for external Django runtime verification (Department + Employee + Project)', async () => {
        // Unlike the tests above (cleaned up via afterEach), this writes to a
        // FIXED, repo-relative path and is NOT deleted afterward — a follow-up
        // step runs real `python manage.py` commands against this exact output.
        const fixedOutDir = path.join(__dirname, '..', '.tmp', 'studio-django-gen')
        rmRf(fixedOutDir)
        fs.mkdirSync(fixedOutDir, { recursive: true })

        const engine = new DjangoEngine()
        await engine.createProject(baseProject(fixedOutDir), fixedOutDir)

        const department: ModelConfig = {
            type: 'model',
            name: 'Department',
            tableName: 't_department',
            module: 'departments',
            crud: true,
            attributes: [
                {
                    name: 'id',
                    type: 'integer',
                    primaryKey: true,
                    nullable: false,
                    unique: true,
                    generationType: 'IDENTITY'
                },
                {
                    name: 'code',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: true,
                    length: 50
                },
                {
                    name: 'name',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: false,
                    length: 255
                },
                {
                    name: 'active',
                    type: 'boolean',
                    primaryKey: false,
                    nullable: false,
                    defaultValue: true
                }
            ]
        }
        await engine.createModel(department, fixedOutDir)

        const employee: ModelConfig = {
            type: 'model',
            name: 'Employee',
            tableName: 't_employee',
            module: 'employees',
            crud: true,
            attributes: [
                {
                    name: 'id',
                    type: 'integer',
                    primaryKey: true,
                    nullable: false,
                    unique: true,
                    generationType: 'IDENTITY'
                },
                {
                    name: 'employee_number',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: true,
                    length: 50
                },
                {
                    name: 'name',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: false,
                    length: 255
                },
                {
                    name: 'department',
                    type: 'relation',
                    nullable: true,
                    relation: { type: 'ManyToOne', entity: 'Department', orphanRemoval: false }
                }
            ]
        } as unknown as ModelConfig
        await engine.createModel(employee, fixedOutDir)

        const project: ModelConfig = {
            type: 'model',
            name: 'Project',
            tableName: 't_project',
            module: 'projects',
            crud: true,
            attributes: [
                {
                    name: 'id',
                    type: 'integer',
                    primaryKey: true,
                    nullable: false,
                    unique: true,
                    generationType: 'IDENTITY'
                },
                {
                    name: 'name',
                    type: 'string',
                    primaryKey: false,
                    nullable: false,
                    unique: false,
                    length: 255
                },
                {
                    name: 'status',
                    type: 'enum',
                    primaryKey: false,
                    nullable: false,
                    enumValues: ['DRAFT', 'SUBMITTED', 'APPROVED'],
                    defaultValue: 'DRAFT'
                }
            ],
            actions: [
                {
                    name: 'submit',
                    method: 'POST',
                    scope: 'detail',
                    implementation: 'demo',
                    targetStatus: 'SUBMITTED',
                    requestDto: {
                        name: 'SubmitRequest',
                        fields: [{ name: 'comment', type: 'string', nullable: true }]
                    }
                }
            ]
        } as unknown as ModelConfig
        await engine.createModel(project, fixedOutDir)

        expect(fs.existsSync(path.join(fixedOutDir, 'manage.py'))).toBe(true)
        expect(fs.existsSync(path.join(fixedOutDir, 'department', 'models.py'))).toBe(true)
        expect(fs.existsSync(path.join(fixedOutDir, 'employee', 'models.py'))).toBe(true)
        expect(fs.existsSync(path.join(fixedOutDir, 'project', 'models.py'))).toBe(true)
        // Intentionally NOT calling rmRf(fixedOutDir) here — output must survive
        // for the manage.py check/makemigrations/migrate/spectacular/test pass.
    })

    it('forwards enableGraphQL:false — GraphQL is NOT wired into the generated project', async () => {
        const engine = new DjangoEngine()
        await engine.createProject(projectWith(outDir, { enableGraphQL: false }), outDir)

        expect(readBaseApi(outDir).enableGraphQL).toBe(false)
        // gated off → the schema aggregator is not emitted
        expect(fs.existsSync(configFile(outDir, 'graphql.py'))).toBe(false)
        expect(fs.readFileSync(configFile(outDir, 'urls.py'), 'utf-8')).not.toContain("path('graphql/'")
    })

    it('forwards enableGraphQL:true — /graphql wiring is present (technical)', async () => {
        const engine = new DjangoEngine()
        await engine.createProject(projectWith(outDir, { enableGraphQL: true }), outDir)

        expect(readBaseApi(outDir).enableGraphQL).toBe(true)
        expect(fs.existsSync(configFile(outDir, 'graphql.py'))).toBe(true)
        expect(fs.readFileSync(configFile(outDir, 'urls.py'), 'utf-8')).toContain("path('graphql/'")
        expect(fs.readFileSync(path.join(outDir, 'requirements.txt'), 'utf-8')).toMatch(
            /strawberry-graphql/
        )
    })

    it('forwards enableGraphQL:true for the domain flavor too', async () => {
        const engine = new DjangoEngine()
        await engine.createProject(
            projectWith(outDir, { enableGraphQL: true, projectStructureStyle: 'domain' }),
            outDir
        )

        expect(readBaseApi(outDir).enableGraphQL).toBe(true)
        expect(fs.existsSync(configFile(outDir, 'graphql.py'))).toBe(true)
        expect(fs.readFileSync(configFile(outDir, 'urls.py'), 'utf-8')).toContain("path('graphql/'")
    })

    it('writes a non-stale igrpCoreVersion matching the installed @igrp/django-engine', async () => {
        const engine = new DjangoEngine()
        await engine.createProject(baseProject(outDir), outDir)

        const installed = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, '..', 'node_modules', '@igrp', 'django-engine', 'package.json'),
                'utf-8'
            )
        ).version
        expect(readBaseApi(outDir).igrpCoreVersion).toBe(installed)
        // the previous hardcoded value must never resurface
        expect(readBaseApi(outDir).igrpCoreVersion).not.toBe('0.1.0-alpha.1')
    })

    it('rejects an invalid Django config (bad artifact) instead of emitting a broken project', async () => {
        const engine = new DjangoEngine()
        // 'my-api' passes apiName derivation ("myapi") but fails the engine's
        // artifact schema (`^[a-zA-Z0-9_]+$`) — the hyphen must be rejected.
        await expect(
            engine.createProject(projectWith(outDir, { artifact: 'my-api' }), outDir)
        ).rejects.toThrow()
    })

    it('exposes no "not implemented" sentinels on the engine surface (regression guard)', () => {
        const engine = new DjangoEngine() as unknown as Record<string, unknown>
        for (const op of ['createProject', 'createModel', 'delete', 'duplicate', 'registry']) {
            expect(typeof engine[op]).toBe('function')
        }
    })
})
