import { ipcMain } from 'electron'
import { IWorkspace, ProjectData } from '../types'
import { WorkspaceRepository } from '../services/workspace-service'
import { ERROR_CODES, EVENTS } from '../constants/events'
import { handleWithCustomErrors } from '../helpers'
import {
  ProjectWorkspace,
  ServiceWorkspace
} from '@igrp/igrp-studio-nextjs-engine/types'

const repo = new WorkspaceRepository()

// Initialize repository
ipcMain.handle(EVENTS.REPOSITORY.INITIALIZE, async () => {
  try {
    await repo.initialize()
  } catch (error) {
    console.error('Repository initialization failed:', error)
    throw error
  }
})

// Workspace Handlers

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.GET_CURRENT, async (event) => {
  try {
    return await repo.getLastAccessedWorkspace()
  } catch (error) {
    console.error('Workspace get last access failed:', error)

    event.sender.send(EVENTS.LOG, {
      code: ERROR_CODES.WORKSPACE.CREATE_FAILED,
      message: error instanceof Error ? error.message : 'Failed to get last access failed:'
    })
    throw error
  }
})

handleWithCustomErrors(
  EVENTS.REPOSITORY.WORKSPACE.CREATE,
  async (event, workspace: Omit<IWorkspace, 'id' | 'createdAt'>) => {
    try {
      return await repo.createWorkspace(workspace)
    } catch (error) {
      event.sender.send(EVENTS.LOG, {
        code: ERROR_CODES.WORKSPACE.CREATE_FAILED,
        message: error instanceof Error ? error.message : 'Failed to create workspace'
      })
      throw error
    }
  }
)

handleWithCustomErrors(
  EVENTS.REPOSITORY.WORKSPACE.UPDATE,
  async (event, id: string, updates: Partial<IWorkspace>) => {
    try {
      return await repo.updateWorkspace(id, updates)
    } catch (error) {
      event.sender.send(EVENTS.LOG, {
        code: ERROR_CODES.WORKSPACE.UPDATE_FAILED,
        message: error instanceof Error ? error.message : 'Failed to update workspace'
      })
      throw error
    }
  }
)

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.DELETE, async (event, id: string) => {
  try {
    await repo.deleteWorkspace(id)
  } catch (error) {
    event.sender.send(EVENTS.LOG, {
      code: ERROR_CODES.WORKSPACE.DELETE_FAILED,
      message: error instanceof Error ? error.message : 'Failed to delete workspace'
    })
    throw error
  }
})

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.GET, async (event, id: string) => {
  try {
    return await repo.getWorkspace(id)
  } catch (error) {
    event.sender.send(EVENTS.LOG, {
      code: ERROR_CODES.WORKSPACE.NOT_FOUND,
      message: error instanceof Error ? error.message : 'Workspace not found'
    })
    return null
  }
})

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.FIND_ALL, async () => {
  try {
    return await repo.listWorkspaces()
  } catch (error) {
    console.error('Failed to fetch workspaces:', error)
    return []
  }
})

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.FIND_RECENT, async (_, limit = 5) => {
  try {
    return await repo.getRecentWorkspaces(limit)
  } catch (error) {
    console.error('Failed to fetch recent workspaces:', error)
    return []
  }
})

ipcMain.handle(
  EVENTS.REPOSITORY.WORKSPACE.SAVE_CUSTOM_YAML,
  async (_, yaml: object, basePath: string) => {
    return await repo.saveCustomCompose(yaml, basePath)
  }
)

handleWithCustomErrors(EVENTS.REPOSITORY.WORKSPACE.OPEN, async (_, workspacePath: string) => {
  try {
    return { result: await repo.openWorkspace(workspacePath) }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to open workspace'
    }
  }
})

// Project Handlers
handleWithCustomErrors(
  EVENTS.REPOSITORY.PROJECT.CREATE,
  async (_event, workspaceId: string, project: Omit<ProjectData, 'id' | 'createdAt'>) => {
    return await repo.addProject(workspaceId, project)
  }
)

handleWithCustomErrors(
  EVENTS.REPOSITORY.PROJECT.UPDATE,
  async (_, projectId: string, updates: Partial<ProjectData>) => {
    return await repo.updateProject(projectId, updates)
  }
)

ipcMain.handle(
  EVENTS.REPOSITORY.PROJECT.CONFIGURE_SERVICE,
  async (_, config: ProjectWorkspace, basePath: string) => {
    await repo.configureService(config, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.REPOSITORY.PROJECT.ADD_TO_WORKSPACE,
  async (_, workspaceId: string, project: ProjectData) => {
    return await repo.addProjectToWorkspace(workspaceId, project)
  }
)

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.DELETE, async (_, projectId: string, basePath: string) => {
  await repo.deleteProject(projectId, basePath)
})

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.GET, async (_, projectId: string) => {
  return await repo.getProject(projectId)
})

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.FIND_ALL, async (_, workspaceId?: string) => {
  try {
    return workspaceId ? await repo.listProjects(workspaceId) : []
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return []
  }
})

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.FIND_RECENT, async (_, limit = 5) => {
  return await repo.getRecentProjects(limit)
})

// Service Handlers
handleWithCustomErrors(
  EVENTS.REPOSITORY.SERVICE.CREATE,
  async (_event, service: ServiceWorkspace, basePath: string) => {
    return await repo.addService(service, basePath)
  }
)

handleWithCustomErrors(
  EVENTS.REPOSITORY.SERVICE.UPDATE,
  async (_, update: ServiceWorkspace, basePath: string) => {
    return await repo.updateService(update, basePath)
  }
)

ipcMain.handle(EVENTS.REPOSITORY.SERVICE.DELETE, async (_, serviceId: string, basePath: string) => {
  await repo.deleteService(serviceId, basePath)
})

ipcMain.handle(EVENTS.REPOSITORY.SERVICE.FIND_ALL, async (_, workspaceId: string) => {
  return await repo.listServices(workspaceId)
})

// Backup Handlers
ipcMain.handle(EVENTS.REPOSITORY.BACKUP.CREATE, async (event, backupPath?: string) => {
  try {
    await repo.backupData(backupPath)
  } catch (error: any) {
    event.sender.send(EVENTS.LOG, {
      code: ERROR_CODES.BACKUP.FAILED,
      message: error
    })
    throw error
  }
})

ipcMain.handle(EVENTS.REPOSITORY.BACKUP.RESTORE, async (event, backupPath: string) => {
  try {
    await repo.restoreData(backupPath)
  } catch (error: any) {
    event.sender.send(EVENTS.LOG, {
      code: ERROR_CODES.BACKUP.RESTORE_FAILED,
      message: error
    })
    throw error
  }
})
