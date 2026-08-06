import type { PermissionConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { getId } from '@renderer/utils'
import type { CreatePermissionInput, PermissionCatalogEntry } from './types'

/** Engine stores the permission key in `name`. */
export function toPermissionConfig(
    entry: Pick<PermissionCatalogEntry, 'id' | 'key' | 'label' | 'description'> & {
        enabled?: boolean
    }
): PermissionConfig {
    return {
        id: entry.id,
        name: entry.key,
        label: entry.label,
        description: entry.description,
        enabled: entry.enabled ?? true
    }
}

export function fromPermissionConfig(config: PermissionConfig): PermissionCatalogEntry {
    return {
        id: config.id,
        key: config.name,
        label: config.label?.trim() || config.name,
        description: config.description,
        enabled: config.enabled,
        usageCount: 0,
        sources: [],
        createdAt: '',
        updatedAt: ''
    }
}

export function buildPermissionConfig(
    input: CreatePermissionInput,
    existingId?: string
): PermissionConfig {
    return {
        id: existingId || getId(),
        name: input.key.trim(),
        label: input.label.trim(),
        description: input.description?.trim() || undefined,
        enabled: true
    }
}
