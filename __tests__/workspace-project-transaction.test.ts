/**
 * Regression tests for the project-creation transaction in
 * `WorkspaceRepository.addProject`.
 *
 * The original order was: workspace registration FIRST, engine generation
 * SECOND. When the engine rejected a config (the .NET `config: {}` bug), the
 * workspace already held an entry pointing at a directory with no
 * `.igrpstudio/baseApi.json` — a "ghost project" whose every artifact
 * operation failed with ENOENT inside `getBaseApiConfig`.
 *
 * The contract under test:
 *   1. engine.createProject runs BEFORE any workspace state is written;
 *   2. for backend frameworks the engine output must include
 *      `.igrpstudio/baseApi.json`, otherwise the creation fails;
 *   3. a failure after generation rolls the generated files back so a retry
 *      doesn't hit the "directory already exists and is not empty" guard.
 */
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { app } from 'electron'

jest.mock('@igrp/igrp-studio-workspace-engine', () => ({
    addProjectToWorkspace: jest.fn(async () => undefined),
    addServiceToWorkspace: jest.fn(async () => undefined),
    newWorkspace: jest.fn(async () => undefined),
    removeProjectFromWorkspace: jest.fn(async () => undefined),
    removeServiceFromWorkspace: jest.fn(async () => undefined),
    saveCustomWorkspaceComposeFile: jest.fn(async () => undefined),
    updateProjectToWorkspace: jest.fn(async () => undefined),
    updateServiceToWorkspace: jest.fn(async () => undefined)
}))

jest.mock('../src/main/services/docker-service', () => ({
    dockerService: {}
}))

const mockGetEngine = jest.fn()
jest.mock('../src/main/engines/EngineFactory', () => ({
    EngineFactory: {
        getEngine: (type: string) => mockGetEngine(type)
    }
}))

// `WORKSPACE_FILE` is computed at module load from `app.getPath('userData')`,
// so the electron stub must point at the temp dir BEFORE the service module
// is evaluated — hence the deferred `require` below instead of a static import.
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'igrp-ws-tx-'))
;(app as { getPath: (name: string) => string }).getPath = () => TMP_ROOT

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WorkspaceRepository } = require('../src/main/services/workspace-service')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { addProjectToWorkspace } = require('@igrp/igrp-studio-workspace-engine')

const WORKSPACE_FILE = path.join(TMP_ROOT, 'igrpstudio.workspaces.json')
const WS_ID = 'ws-1'

const readWorkspaces = (): {
    workspaces: Array<{ projects?: Array<{ config: { name: string } }> }>
} => JSON.parse(fs.readFileSync(WORKSPACE_FILE, 'utf-8'))

const dotnetConfig = {
    name: 'crm',
    description: '',
    artifact: 'crm-api',
    database: 'Postgresql',
    projectStructureStyle: 'technical',
    enableObservability: false,
    enableEntityRevision: false
}

let projectCounter = 0
const newProjectInput = (framework: string) => {
    projectCounter += 1
    const projectPath = path.join(TMP_ROOT, 'projects', `proj-${projectCounter}`)
    return {
        projectPath,
        input: {
            name: `CRM ${projectCounter}`,
            type: 'backend',
            framework,
            path: projectPath,
            storageMode: 'managed',
            themeColor: '#000000',
            icon: '',
            config: { ...dotnetConfig, name: `crm${projectCounter}` }
        } as never
    }
}

/** Engine stub whose createProject behavior is injectable per test. */
const engineWith = (
    createProject: (project: { path: string }, basePath: string) => Promise<void>
) => ({
    createProject: jest.fn(createProject)
})

const writeBaseApi = async (projectPath: string): Promise<void> => {
    fs.mkdirSync(path.join(projectPath, '.igrpstudio'), { recursive: true })
    fs.writeFileSync(
        path.join(projectPath, '.igrpstudio', 'baseApi.json'),
        JSON.stringify({ type: 'dotnet' })
    )
}

describe('WorkspaceRepository.addProject transaction', () => {
    let repository: InstanceType<typeof WorkspaceRepository>

    beforeEach(() => {
        jest.clearAllMocks()
        const wsPath = path.join(TMP_ROOT, 'workspace')
        fs.mkdirSync(wsPath, { recursive: true })
        const now = new Date().toISOString()
        fs.writeFileSync(
            WORKSPACE_FILE,
            JSON.stringify(
                {
                    workspaces: [
                        {
                            id: WS_ID,
                            name: 'demo',
                            path: wsPath,
                            projects: [],
                            createdAt: now,
                            updatedAt: now
                        }
                    ]
                },
                null,
                2
            )
        )
        repository = new WorkspaceRepository()
    })

    afterAll(() => {
        fs.rmSync(TMP_ROOT, { recursive: true, force: true })
    })

    it('does not register a workspace entry when the engine rejects the config', async () => {
        // The pre-fix .NET failure: dotnet-engine's AJV validation throws on
        // an incomplete baseApi config. No ghost entry may survive it.
        mockGetEngine.mockReturnValue(
            engineWith(async () => {
                throw new Error(
                    "ConfigValidationError: data must have required property 'database'"
                )
            })
        )
        const { input } = newProjectInput('dotnet')

        await expect(repository.addProject(WS_ID, input)).rejects.toThrow(/database/)

        expect(readWorkspaces().workspaces[0].projects).toHaveLength(0)
        expect(addProjectToWorkspace).not.toHaveBeenCalled()
    })

    it('rejects a backend project whose engine wrote no baseApi.json', async () => {
        mockGetEngine.mockReturnValue(
            engineWith(async (project) => {
                // "Succeeds" but produces an empty directory.
                fs.mkdirSync(project.path, { recursive: true })
            })
        )
        const { input } = newProjectInput('dotnet')

        await expect(repository.addProject(WS_ID, input)).rejects.toThrow(/baseApi\.json/)

        expect(readWorkspaces().workspaces[0].projects).toHaveLength(0)
        expect(addProjectToWorkspace).not.toHaveBeenCalled()
    })

    it('registers the project after the engine produced baseApi.json', async () => {
        mockGetEngine.mockReturnValue(
            engineWith(async (project) => {
                await writeBaseApi(project.path)
            })
        )
        const { input, projectPath } = newProjectInput('dotnet')

        const created = await repository.addProject(WS_ID, input)

        expect(created.id).toBeTruthy()
        expect(mockGetEngine).toHaveBeenCalledWith('dotnet')
        expect(addProjectToWorkspace).toHaveBeenCalledTimes(1)
        const { workspaces } = readWorkspaces()
        expect(workspaces[0].projects).toHaveLength(1)
        expect(fs.existsSync(path.join(projectPath, '.igrpstudio', 'baseApi.json'))).toBe(true)
    })

    it('rolls generated files back when workspace registration fails after generation', async () => {
        mockGetEngine.mockReturnValue(
            engineWith(async (project) => {
                await writeBaseApi(project.path)
            })
        )
        ;(addProjectToWorkspace as jest.Mock).mockRejectedValueOnce(
            new Error('compose write failed')
        )
        const { input, projectPath } = newProjectInput('dotnet')

        await expect(repository.addProject(WS_ID, input)).rejects.toThrow(/compose write failed/)

        expect(readWorkspaces().workspaces[0].projects).toHaveLength(0)
        // Generated output removed → a retry passes the "directory already
        // exists and is not empty" guard again.
        expect(fs.existsSync(projectPath)).toBe(false)
    })

    it('keeps the Spring flow intact (engine first, then registration)', async () => {
        const callOrder: string[] = []
        mockGetEngine.mockReturnValue(
            engineWith(async (project) => {
                callOrder.push('engine.createProject')
                await writeBaseApi(project.path)
            })
        )
        ;(addProjectToWorkspace as jest.Mock).mockImplementationOnce(async () => {
            callOrder.push('addProjectToWorkspace')
        })
        const { input } = newProjectInput('springboot')

        const created = await repository.addProject(WS_ID, input)

        expect(created.id).toBeTruthy()
        expect(mockGetEngine).toHaveBeenCalledWith('springboot')
        expect(callOrder).toEqual(['engine.createProject', 'addProjectToWorkspace'])
        expect(readWorkspaces().workspaces[0].projects).toHaveLength(1)
    })
})
