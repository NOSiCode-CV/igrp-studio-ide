import type { PermissionConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'

type HandlerResponse<T = unknown> = { result?: T; error?: unknown }

function assertOk<T>(response: HandlerResponse<T>): T {
    if (response?.error) {
        const err = response.error
        const message =
            typeof err === 'string'
                ? err
                : err instanceof Error
                  ? err.message
                  : (err as { message?: string })?.message || String(err)
        throw new Error(message)
    }
    return response?.result as T
}

export async function engineGetPermissions(basePath: string): Promise<PermissionConfig[]> {
    const response = (await window.engine.getPermissions(
        ENV_TYPES.NEXTJS,
        basePath
    )) as HandlerResponse<PermissionConfig[]>
    return assertOk(response) ?? []
}

export async function engineSavePermission(
    config: PermissionConfig,
    basePath: string
): Promise<void> {
    const response = (await window.engine.savePermission(
        config,
        ENV_TYPES.NEXTJS,
        basePath
    )) as HandlerResponse
    assertOk(response)
}

export async function engineDeletePermission(id: string, basePath: string): Promise<void> {
    const response = (await window.engine.deletePermission(
        id,
        ENV_TYPES.NEXTJS,
        basePath
    )) as HandlerResponse
    assertOk(response)
}
