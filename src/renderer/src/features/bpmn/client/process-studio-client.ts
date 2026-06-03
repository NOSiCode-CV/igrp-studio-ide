import { createProcessStudioClient } from '@igrp/framework-process-studio-client'
import type { ProcessStudioClient } from '@igrp/framework-process-studio-types'
import type { BPMNConfig } from 'src/main/types'

export interface ProcessStudioClientBinding {
    client: ProcessStudioClient
    config: BPMNConfig
    /** Effective base URL the SDK will hit (after duplicate-prefix normalisation). */
    baseUrl: string
}

/**
 * The SDK hardcodes the `/api/v1/...` path prefix on every endpoint. If the
 * user-configured `basePath` ALSO ends in `/api/v1` (the legacy desktop config
 * convention, since the old `bpmn-service.ts` did not add a prefix itself),
 * the resulting URL would duplicate the segment. Strip the trailing duplicate
 * once so configs from before this milestone keep working.
 */
function normaliseBasePath(basePath: string): string {
    const trimmed = basePath.replace(/\/$/, '')
    return trimmed.replace(/\/api\/v1$/, '')
}

export function buildProcessStudioClient(config: BPMNConfig): ProcessStudioClientBinding {
    const apiUrl = config.apiUrl.replace(/\/$/, '')
    const basePath = normaliseBasePath(config.basePath)
    const baseUrl = `${apiUrl}${basePath}`
    const headers: Record<string, string> = {}
    if (config.token) {
        headers.Authorization = `Bearer ${config.token}`
    }

    const client = createProcessStudioClient({
        baseUrl,
        apiKey: config.token || undefined,
        headers
    })

    return { client, config, baseUrl }
}

export async function loadActiveBPMNConfig(): Promise<BPMNConfig | null> {
    const settings = window.igrpStudioSettings
    if (!settings) return null
    const { configs, activeConfigId } = await settings.getBPMNConfigs()
    if (!activeConfigId) return null
    return configs.find((c) => c.id === activeConfigId) ?? null
}
