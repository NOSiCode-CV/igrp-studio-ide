import { setBasePath, setConfig, setWorkspace } from '@renderer/redux/thunks'
import { ROUTES } from '@renderer/routes/routeConstants'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { ProjectData } from 'src/main/types'

export const LAST_OPENED_PROJECT_KEY = 'igrp:last-opened-project-id'

interface RootState {
    PageBuilder: {
        basePath: string
        config?: ProjectData
    }
}

const selectStudioState = (state: RootState) => state.PageBuilder

export const rememberLastOpenedProject = (project: ProjectData): void => {
    try {
        window.localStorage.setItem(LAST_OPENED_PROJECT_KEY, project.id)
    } catch {
        // localStorage can be unavailable in restricted renderer contexts.
    }
}

/** Rehydrates the project that was open before a renderer reload. */
export const useProjectResume = (): { resolved: boolean } => {
    const dispatch: any = useDispatch()
    const navigate = useNavigate()
    const { basePath, config } = useSelector(selectStudioState)
    const [resolved, setResolved] = useState(false)

    useEffect(() => {
        if (basePath && config) {
            setResolved(true)
            return
        }

        let cancelled = false
        void (async () => {
            try {
                const workspaces = await window.igrpStudio.workspace.findAllWorkspaces()
                const projectLists = await Promise.all(
                    workspaces.map((workspace) =>
                        window.igrpStudio.workspace.findAllProjects(workspace.id)
                    )
                )
                const projects: ProjectData[] = projectLists.flat()
                let lastOpenedId: string | null = null
                try {
                    lastOpenedId = window.localStorage.getItem(LAST_OPENED_PROJECT_KEY)
                } catch {
                    // Fall back to the most recently updated project below.
                }

                const project =
                    (lastOpenedId && projects.find((item) => item.id === lastOpenedId)) ||
                    [...projects].sort((a, b) => {
                        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime()
                        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime()
                        return bDate - aDate
                    })[0]

                if (!cancelled && project) {
                    const projectWorkspace = workspaces.find(
                        (workspace) => workspace.id === project.workspaceId
                    )
                    if (projectWorkspace) dispatch(setWorkspace(projectWorkspace))
                    dispatch(setBasePath(project.path))
                    dispatch(setConfig(project))
                }
            } catch (error) {
                console.error('Failed to restore the last opened project:', error)
            } finally {
                if (!cancelled) setResolved(true)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [basePath, config, dispatch])

    useEffect(() => {
        if (resolved && !basePath) {
            navigate(ROUTES.PATH_IDE_INITIAL_SCREEN, { replace: true })
        }
    }, [basePath, navigate, resolved])

    return { resolved }
}
