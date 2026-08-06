import type { FileTree, IWorkspace, ProjectData } from 'src/main/types'
import {
    clearActiveStudioSession,
    persistActiveStudioSession,
    persistSessionFromProject,
    readActiveStudioSession
} from '@renderer/lib/active-studio-session'
import {
    clearStudioProjectAction,
    setBasePathAction,
    setChangeStatusAction,
    setConfigAction,
    setCurrentItemAction,
    setFilesThreeAction,
    setWorkspaceAction
} from './reducer'

/**
 * set BasePath
 * @param {*} param0
 */
export const setBasePath = (basePath: string) => async (dispatch: any) => {
    try {
        dispatch(setBasePathAction(basePath))
        const session = readActiveStudioSession()
        if (session?.projectId && basePath) {
            persistActiveStudioSession({ ...session, basePath })
        }
    } catch (error) {}
}

/**
 * set BasePath
 * @param {*} param0
 */
export const setConfig = (appConfig: ProjectData) => async (dispatch: any) => {
    try {
        dispatch(setConfigAction(appConfig))
        persistSessionFromProject(appConfig)
    } catch (error) {}
}

/**
 * Leave the open project (e.g. logo / back-to-home) without wiping the
 * persisted session, so a later refresh on a studio route can restore it.
 */
export const leaveStudioProject = () => async (dispatch: any) => {
    try {
        dispatch(clearStudioProjectAction())
    } catch (error) {}
}

/**
 * Restore last opened project after a hard refresh (Redux memory is empty).
 * @returns true when studio context is available (already set or restored)
 */
export const restoreActiveStudioSession = () => async (dispatch: any, getState: any) => {
    try {
        const { basePath, config } = getState().PageBuilder ?? {}
        if (basePath && config?.id) return true

        const session = readActiveStudioSession()
        if (!session?.projectId) return false

        const project: ProjectData | undefined = await window.igrpStudio.workspace.getProject(
            session.projectId
        )
        if (!project?.path) {
            clearActiveStudioSession()
            return false
        }

        dispatch(setBasePathAction(project.path))
        dispatch(setConfigAction(project))
        persistSessionFromProject(project)

        const workspaceId = project.workspaceId || session.workspaceId
        if (workspaceId) {
            const workspace: IWorkspace | undefined =
                await window.igrpStudio.workspace.getWorkspace(workspaceId)
            if (workspace) {
                dispatch(setWorkspaceAction(workspace))
            }
        }

        return true
    } catch (error) {
        console.error('Failed to restore active studio session:', error)
        clearActiveStudioSession()
        return false
    }
}

/**
 * set status
 * @param {*} param0
 */
export const setChangeStatus = (status: boolean) => async (dispatch: any) => {
    try {
        dispatch(setChangeStatusAction(status))
    } catch (error) {}
}

/**
 * set status
 * @param {*} param0
 */
export const setCurrentItem = (item: any) => async (dispatch: any) => {
    try {
        dispatch(setCurrentItemAction(item))
    } catch (error) {}
}

/**
 * set status
 * @param {*} param0
 */
export const setWorkspace = (workspace: IWorkspace | null) => async (dispatch: any) => {
    try {
        dispatch(setWorkspaceAction(workspace))
    } catch (error) {}
}

/* /**
 *  fetch  pages
 * @param {*} param0
 */

export const getFileThree = (basePath: string) => async (dispatch: any) => {
    try {
        const filesThree: FileTree[] = await window.api.fetchFiles(`${basePath}/.igrpstudio`)
        dispatch(setFilesThreeAction(filesThree))
    } catch (error) {
        console.error('error:', error)
    }
}
