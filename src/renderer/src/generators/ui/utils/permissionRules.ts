import type {
    Layout,
    PermissionRuleDefinition,
    RuleDefinition,
    VisibilityRuleDefinition
} from '@igrp/igrp-studio-nextjs-engine/types'
import { generateId } from '@renderer/utils'

export const ROOT_COMPONENT_NAMES = new Set(['page', 'component', 'processStep'])

export const PERMISSION_ACTIONS = ['hide', 'disable', 'replace', 'assert'] as const

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

export const DISABLED_PROP_HINTS = ['disabled', 'readOnly', 'editable'] as const

export const DEFAULT_DISABLED_PROP = 'disabled'

export function isRootLayoutNode(componentName?: string): boolean {
    return !!componentName && ROOT_COMPONENT_NAMES.has(componentName)
}

export function createEmptyVisibilityRule(): VisibilityRuleDefinition {
    return { type: 'visibility', condition: '' }
}

export function createEmptyPermissionRule(): PermissionRuleDefinition {
    return {
        type: 'permission',
        permission: [],
        action: 'hide'
    }
}

export function createSimpleFallbackLayout(label: string): Layout {
    const id = generateId('button')
    return {
        id,
        tag: 'fallback',
        componentName: 'button',
        properties: {
            content: label.trim() || 'Unauthorized',
            variant: 'ghost',
            disabled: true
        },
        children: [],
        interactions: {}
    }
}

export function isVisibilityRule(rule: RuleDefinition): rule is VisibilityRuleDefinition {
    return rule.type === 'visibility'
}

export function isPermissionRule(rule: RuleDefinition): rule is PermissionRuleDefinition {
    return rule.type === 'permission'
}

export interface RuleValidationResult {
    ok: boolean
    errors: string[]
    rule?: RuleDefinition
}

/**
 * Validates + normalizes a permission rule for persistence (§6).
 * Returns a clean object: omits default `mode`/`disabledProp`, strips
 * assert off-root, requires fallback for replace.
 */
export function validateAndNormalizePermissionRule(
    draft: PermissionRuleDefinition,
    options: { isRoot: boolean }
): RuleValidationResult {
    const errors: string[] = []

    const permission = (draft.permission ?? [])
        .map((p) => (typeof p === 'string' ? p.trim() : ''))
        .filter(Boolean)

    if (permission.length === 0) {
        errors.push('At least one permission is required.')
    }

    let action = draft.action ?? 'hide'
    if (!PERMISSION_ACTIONS.includes(action)) {
        errors.push(`Invalid action: ${action}`)
        action = 'hide'
    }

    if (action === 'assert' && !options.isRoot) {
        errors.push('Assert is only allowed on page, component, or processStep roots.')
    }

    let mode = draft.mode
    if (permission.length < 2) {
        mode = undefined
    } else if (mode && mode !== 'all' && mode !== 'any') {
        errors.push(`Invalid mode: ${mode}`)
        mode = 'all'
    } else if (mode === 'all') {
        // Engine default — omit from JSON
        mode = undefined
    }

    let disabledProp = draft.disabledProp?.trim() || undefined
    if (action !== 'disable') {
        disabledProp = undefined
    } else if (disabledProp === DEFAULT_DISABLED_PROP) {
        disabledProp = undefined
    } else if (disabledProp === '') {
        disabledProp = undefined
    }

    let fallback = draft.fallback
    if (action === 'replace') {
        if (!fallback) {
            errors.push('Fallback is required when action is replace.')
        }
    } else {
        fallback = undefined
    }

    if (errors.length > 0) {
        return { ok: false, errors }
    }

    const rule: PermissionRuleDefinition = {
        type: 'permission',
        permission,
        action
    }

    if (mode) rule.mode = mode
    if (disabledProp) rule.disabledProp = disabledProp
    if (fallback) rule.fallback = fallback

    return { ok: true, errors: [], rule }
}

export function validateAndNormalizeVisibilityRule(
    condition: string
): RuleValidationResult {
    const trimmed = condition?.trim() ?? ''
    if (!trimmed) {
        return { ok: false, errors: ['Visibility condition is required.'] }
    }
    return {
        ok: true,
        errors: [],
        rule: { type: 'visibility', condition: trimmed }
    }
}

/** Defensive cleanup before save — strip assert on non-roots, drop empty rules arrays. */
export function sanitizeRulesForNode(
    rules: RuleDefinition[] | undefined,
    componentName?: string
): RuleDefinition[] | undefined {
    if (!rules?.length) return undefined

    const isRoot = isRootLayoutNode(componentName)
    const cleaned: RuleDefinition[] = []

    for (const rule of rules) {
        if (isVisibilityRule(rule)) {
            if (rule.condition?.trim()) cleaned.push(rule)
            continue
        }
        if (isPermissionRule(rule)) {
            const result = validateAndNormalizePermissionRule(rule, { isRoot })
            if (result.ok && result.rule) {
                const normalized = { ...result.rule } as PermissionRuleDefinition
                if (normalized.fallback) {
                    normalized.fallback = sanitizeLayoutRules(normalized.fallback)
                }
                cleaned.push(normalized)
            }
        }
    }

    return cleaned.length > 0 ? cleaned : undefined
}

export function describePermissionRule(rule: PermissionRuleDefinition): string {
    const perms = rule.permission?.join(', ') || '—'
    const action = rule.action ?? 'hide'
    return `${action}: ${perms}`
}

export function moveRule<T>(list: T[], from: number, to: number): T[] {
    if (to < 0 || to >= list.length || from === to) return list
    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
}

/** Walk a layout tree and sanitize/omit rules on every node. */
export function sanitizeLayoutRules<T extends { componentName?: string; rules?: RuleDefinition[]; children?: T[] }>(
    node: T | undefined
): T | undefined {
    if (!node) return node

    const rules = sanitizeRulesForNode(node.rules, node.componentName)
    const children = node.children?.map((child) => sanitizeLayoutRules(child)!)

    const next = { ...node } as T
    if (rules) next.rules = rules
    else delete (next as { rules?: RuleDefinition[] }).rules

    if (children) next.children = children
    return next
}
