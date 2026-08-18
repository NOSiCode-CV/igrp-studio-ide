/**
 * Behavioural coverage for importing an existing backend as a linked project.
 * The source directory must remain the source of truth across a workspace
 * reopen; only workspace metadata is added or updated.
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

jest.mock('../src/main/engines/EngineFactory', () => ({
    EngineFactory: {
        getEngine: jest.fn()
    }
}))

const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'igrp-linked-project-'))
;(app as { getPath: (name: string) => string }).getPath = () => TMP_ROOT

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WorkspaceRepository } = require('../src/main/services/workspace-service')

const WORKSPACE_FILE = path.join(TMP_ROOT, 'igrpstudio.workspaces.json')

const writeJson = (filePath: string, value: unknown): void => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

const createLinkedBackend = (root: string): string => {
    const projectPath = path.join(root, 'backend')
    writeJson(path.join(projectPath, '.igrpstudio', 'baseApi.json'), {
        type: 'dotnet',
        apiName: 'linkedBackend',
        artifact: 'linked-backend',
        database: 'Postgresql',
        projectStructureStyle: 'domain'
    })
    return projectPath
}

describe('linked project workspace persistence', () => {
    afterAll(() => {
        fs.rmSync(TMP_ROOT, { recursive: true, force: true })
    })

    it('reopens a linked backend at its existing source path', async () => {
        const workspacePath = path.join(TMP_ROOT, 'NhaFlow')
        const projectPath = createLinkedBackend(path.join(TMP_ROOT, 'source-one'))
        writeJson(path.join(workspacePath, '.igrpstudio', 'workspace.json'), {
            id: 'workspace-one',
            workspace: 'nhaflow',
            projects: [
                {
                    config: {
                        id: 'project-one',
                        name: 'NhaFlow',
                        type: 'dotnet',
                        database: 'Postgresql'
                    },
                    projectPath,
                    storageMode: 'linked',
                    dependsOn: []
                }
            ],
            services: []
        })

        writeJson(WORKSPACE_FILE, { workspaces: [] })
        const repository = new WorkspaceRepository()
        const workspace = await repository.openWorkspace(workspacePath)

        expect(workspace.name).toBe('NhaFlow')
        expect(workspace.projects).toHaveLength(1)
        expect(workspace.projects?.[0].path).toBe(path.resolve(projectPath))
        expect(workspace.projects?.[0].storageMode).toBe('linked')
        expect(fs.existsSync(path.join(projectPath, '.igrpstudio', 'baseApi.json'))).toBe(true)
    })

    it('rejects a linked entry that has no valid Studio descriptor', async () => {
        const workspacePath = path.join(TMP_ROOT, 'invalid-workspace')
        const projectPath = path.join(TMP_ROOT, 'source-without-descriptor')
        fs.mkdirSync(projectPath, { recursive: true })
        writeJson(path.join(workspacePath, '.igrpstudio', 'workspace.json'), {
            id: 'workspace-invalid',
            workspace: 'invalid',
            projects: [
                {
                    config: { id: 'project-invalid', name: 'Invalid', type: 'dotnet' },
                    projectPath,
                    storageMode: 'linked'
                }
            ],
            services: []
        })

        writeJson(WORKSPACE_FILE, { workspaces: [] })
        const repository = new WorkspaceRepository()

        await expect(repository.openWorkspace(workspacePath)).rejects.toThrow(
            /Invalid workspace configuration file: Linked project is missing \.igrpstudio\/baseApi\.json or baseApp\.json/
        )
    })

    it('persists a linked import for a later process reopen', async () => {
        const workspacePath = path.join(TMP_ROOT, 'import-workspace')
        const projectPath = createLinkedBackend(path.join(TMP_ROOT, 'source-two'))
        writeJson(path.join(workspacePath, '.igrpstudio', 'workspace.json'), {
            id: 'workspace-import',
            workspace: 'import',
            projects: [],
            services: []
        })
        writeJson(WORKSPACE_FILE, {
            workspaces: [
                {
                    id: 'workspace-import',
                    name: 'Import Workspace',
                    slug: 'import',
                    path: workspacePath,
                    projects: [],
                    services: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]
        })

        const repository = new WorkspaceRepository()
        await repository.updateProject('project-import', {
            workspaceId: 'workspace-import',
            name: 'Linked Backend',
            path: projectPath,
            type: 'backend',
            framework: 'dotnet',
            storageMode: 'linked',
            config: {
                name: 'Linked Backend',
                type: 'dotnet',
                database: 'Postgresql',
                artifact: 'linked-backend',
                projectStructureStyle: 'domain'
            }
        })

        const descriptor = JSON.parse(
            fs.readFileSync(path.join(workspacePath, '.igrpstudio', 'workspace.json'), 'utf8')
        )
        expect(descriptor.projects).toHaveLength(1)
        expect(descriptor.projects[0].projectPath).toBe(path.resolve(projectPath))
        expect(descriptor.projects[0].storageMode).toBe('linked')
    })
})
