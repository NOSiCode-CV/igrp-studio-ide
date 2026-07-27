import type { PermissionRuleDefinition } from '@igrp/igrp-studio-nextjs-engine/types'

export interface PermissionCatalogEntry {
    id: string
    key: string
    label: string
    description?: string
    usageCount: number
    sources?: string[]
    createdAt: string
    updatedAt: string
}

export type PermissionAction = NonNullable<PermissionRuleDefinition['action']>

export type SuggestionConfidence = 'high' | 'medium' | 'low'

export interface PermissionRuleSuggestion {
    permission: string[]
    action: PermissionAction
    disabledProp?: string
    confidence: SuggestionConfidence
    reason: string
    createIfMissing?: boolean
    label?: string
}

export interface PermissionSuggestionResult {
    recommended: PermissionRuleSuggestion | null
    alternatives: PermissionRuleSuggestion[]
    elementLabel: string
}

export interface SuggestionContext {
    componentName: string
    tag: string
    label?: string
    properties: Record<string, unknown>
    interactions?: Record<string, unknown>
    isRoot: boolean
    pageName?: string
}

export interface CreatePermissionInput {
    key: string
    label: string
    description?: string
}
