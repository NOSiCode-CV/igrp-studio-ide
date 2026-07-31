import type { ProjectData } from 'src/main/types'

const STORAGE_KEY = 'igrp.studio.activeProject'

export interface ActiveStudioSession {
    projectId: string
    basePath: string
    workspaceId?: string
}

export function readActiveStudioSession(): ActiveStudioSession | null {
    try {
        const raw = window.localStorage?.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as ActiveStudioSession
        if (!parsed?.projectId || !parsed?.basePath) return null
        return parsed
    } catch {
        return null
    }
}

export function persistActiveStudioSession(session: ActiveStudioSession): void {
    try {
        window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
        // ignore quota / private mode
    }
}

export function persistSessionFromProject(project: ProjectData | undefined | null): void {
    if (!project?.id || !project?.path) return
    persistActiveStudioSession({
        projectId: project.id,
        basePath: project.path,
        workspaceId: project.workspaceId
    })
}

export function clearActiveStudioSession(): void {
    try {
        window.localStorage?.removeItem(STORAGE_KEY)
    } catch {
        // ignore
    }
}
