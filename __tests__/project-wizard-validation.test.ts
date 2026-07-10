/**
 * Regression tests for the project-wizard Zod schema (`useProjectValidation`).
 *
 * Locks in the .NET rules added after the Formik→RHF migration regression:
 * an incomplete .NET config (missing artifact / database /
 * projectStructureStyle) used to pass client-side validation and only blow
 * up inside `@igrp/dotnet-engine`'s AJV schema — after a ghost project entry
 * had already been written to the workspace.
 *
 * Also pins the pre-existing Spring rules so the .NET additions can never
 * regress them.
 */
import { useProjectValidation } from '../src/renderer/src/browser/project/validation'

// i18n stub: returns a stable, distinct string per key + interpolation.
const t = (key: string, opts?: Record<string, unknown>): string =>
    opts ? `${key}:${Object.values(opts).join(',')}` : key

const buildSchema = (step: number) => useProjectValidation({ t, step })

/** Collect `config.<field>` issue paths from a failed parse. */
const configIssueFields = (result: {
    success: boolean
    error?: { issues: { path: PropertyKey[] }[] }
}): string[] =>
    result.success || !result.error
        ? []
        : result.error.issues
              .filter((issue) => issue.path[0] === 'config')
              .map((issue) => String(issue.path[1]))

const completeDotnetConfig = {
    name: 'crm',
    description: '',
    artifact: 'crm-api',
    database: 'Postgresql',
    projectStructureStyle: 'technical',
    enableObservability: false,
    enableEntityRevision: false
}

const dotnetProject = (config: Record<string, unknown>) => ({
    name: 'My Project',
    type: 'backend',
    framework: 'dotnet',
    path: 'C:/projects/crm',
    config
})

const completeSpringConfig = {
    name: 'crm',
    group: 'cv.igrp',
    artifact: 'crm-api',
    database: 'Postgresql'
}

const springProject = (config: Record<string, unknown>) => ({
    name: 'My Project',
    type: 'backend',
    framework: 'springboot',
    path: 'C:/projects/crm',
    config
})

describe('project wizard validation — .NET (step 2)', () => {
    const schema = buildSchema(2)

    it('accepts a complete .NET config', () => {
        const result = schema.safeParse(dotnetProject(completeDotnetConfig))
        expect(result.success).toBe(true)
    })

    it('accepts the DotNetConfig defaults once name and artifact are filled', () => {
        // Mirrors DEFAULT_DOTNET_CONFIG seeded by getDefaultConfigByFramework:
        // database/projectStructureStyle pre-filled, name/artifact typed in.
        const result = schema.safeParse(
            dotnetProject({
                ...completeDotnetConfig,
                database: 'Postgresql',
                projectStructureStyle: 'technical'
            })
        )
        expect(result.success).toBe(true)
    })

    it('rejects a missing artifact', () => {
        const { artifact: _omitted, ...config } = completeDotnetConfig
        const result = schema.safeParse(dotnetProject(config))
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('artifact')
    })

    it('rejects an artifact containing spaces', () => {
        const result = schema.safeParse(
            dotnetProject({ ...completeDotnetConfig, artifact: 'crm api' })
        )
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('artifact')
    })

    it('rejects a missing database', () => {
        const { database: _omitted, ...config } = completeDotnetConfig
        const result = schema.safeParse(dotnetProject(config))
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('database')
    })

    it('rejects a missing projectStructureStyle', () => {
        const { projectStructureStyle: _omitted, ...config } = completeDotnetConfig
        const result = schema.safeParse(dotnetProject(config))
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('projectStructureStyle')
    })

    it('rejects a missing config.name', () => {
        const { name: _omitted, ...config } = completeDotnetConfig
        const result = schema.safeParse(dotnetProject(config))
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('name')
    })

    it('reports every missing field for an empty config (the pre-fix failure mode)', () => {
        // This is exactly the state the RHF migration produced: framework
        // switched to .NET with `config: {}`. The engine used to be the
        // first thing to complain — now the wizard blocks the submit.
        const result = schema.safeParse(dotnetProject({}))
        expect(result.success).toBe(false)
        const fields = configIssueFields(result)
        expect(fields).toEqual(
            expect.arrayContaining(['name', 'artifact', 'database', 'projectStructureStyle'])
        )
    })
})

describe('project wizard validation — Spring rules preserved (step 2)', () => {
    const schema = buildSchema(2)

    it('accepts a complete Spring config', () => {
        const result = schema.safeParse(springProject(completeSpringConfig))
        expect(result.success).toBe(true)
    })

    it('still rejects a missing group', () => {
        const { group: _omitted, ...config } = completeSpringConfig
        const result = schema.safeParse(springProject(config))
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('group')
    })

    it('does not apply the .NET-only projectStructureStyle rule to Spring', () => {
        // completeSpringConfig has no projectStructureStyle and must pass.
        const result = schema.safeParse(springProject(completeSpringConfig))
        expect(result.success).toBe(true)
    })
})

const completeDjangoConfig = {
    name: 'crm',
    description: '',
    artifact: 'crm_api',
    database: 'PostgreSQL',
    projectStructureStyle: 'technical',
    enableObservability: false,
    enableEntityRevision: false,
    enableGraphQL: false
}

const djangoProject = (config: Record<string, unknown>) => ({
    name: 'My Project',
    type: 'backend',
    framework: 'django',
    path: 'C:/projects/crm',
    config
})

describe('project wizard validation — Django (step 2)', () => {
    const schema = buildSchema(2)

    it('accepts a complete Django config (technical)', () => {
        const result = schema.safeParse(djangoProject(completeDjangoConfig))
        expect(result.success).toBe(true)
    })

    it('accepts the domain flavor and enableGraphQL: true', () => {
        const result = schema.safeParse(
            djangoProject({
                ...completeDjangoConfig,
                projectStructureStyle: 'domain',
                enableGraphQL: true
            })
        )
        expect(result.success).toBe(true)
    })

    it('rejects a missing artifact', () => {
        const { artifact: _omitted, ...config } = completeDjangoConfig
        const result = schema.safeParse(djangoProject(config))
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('artifact')
    })

    it('rejects a non-snake artifact (Python package: no hyphen)', () => {
        const result = schema.safeParse(
            djangoProject({ ...completeDjangoConfig, artifact: 'crm-api' })
        )
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('artifact')
    })

    it('rejects a missing database', () => {
        const { database: _omitted, ...config } = completeDjangoConfig
        const result = schema.safeParse(djangoProject(config))
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('database')
    })

    it('rejects a missing config.name', () => {
        const { name: _omitted, ...config } = completeDjangoConfig
        const result = schema.safeParse(djangoProject(config))
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('name')
    })

    it('rejects a non-boolean enableGraphQL', () => {
        const result = schema.safeParse(
            djangoProject({ ...completeDjangoConfig, enableGraphQL: 'yes' })
        )
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toContain('enableGraphQL')
    })

    it('reports the required fields for an empty config (no silent Spring fallback)', () => {
        const result = schema.safeParse(djangoProject({}))
        expect(result.success).toBe(false)
        expect(configIssueFields(result)).toEqual(
            expect.arrayContaining(['name', 'artifact', 'database', 'projectStructureStyle'])
        )
    })
})

describe('project wizard validation — step gating', () => {
    it('does not validate config on step 1', () => {
        const schema = buildSchema(1)
        const result = schema.safeParse(dotnetProject({}))
        expect(result.success).toBe(true)
    })
})
