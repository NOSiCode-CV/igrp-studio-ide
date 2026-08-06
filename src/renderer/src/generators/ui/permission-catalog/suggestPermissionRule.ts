import type {
    PermissionCatalogEntry,
    PermissionRuleSuggestion,
    PermissionSuggestionResult,
    SuggestionContext
} from './types'

const INPUT_COMPONENTS = new Set([
    'input',
    'inputText',
    'inputNumber',
    'inputPassword',
    'inputSearch',
    'inputUrl',
    'inputPhone',
    'inputTime',
    'inputDatePicker',
    'inputColor',
    'inputFile',
    'inputHidden',
    'inputAddOn',
    'select',
    'combobox',
    'checkbox',
    'textarea',
    'number',
    'password',
    'phone',
    'search',
    'link',
    'datePickerSingle',
    'timePicker',
    'colorPicker',
    'fileUpload'
])

const BUTTON_LIKE = new Set(['button', 'link'])

function deriveScope(pageName?: string, tag?: string): string {
    const source = (pageName || tag || 'resource').replace(/([a-z])([A-Z])/g, '$1_$2')
    const normalized = source.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const tokens = normalized.split('_').filter(Boolean)
    if (tokens.length === 0) return 'resource'

    const entityHints = ['invoice', 'invoices', 'user', 'users', 'article', 'order', 'tax']
    for (const hint of entityHints) {
        if (tokens.some((t) => t.includes(hint))) {
            return hint.replace(/s$/, '')
        }
    }
    return tokens[tokens.length - 1].replace(/s$/, '') || 'resource'
}

function collectText(ctx: SuggestionContext): string {
    const props = ctx.properties ?? {}
    const parts = [
        ctx.tag,
        ctx.label,
        props.content,
        props.label,
        props.title,
        props.headerTitle,
        props.labelTrigger
    ]
    return parts
        .filter((p) => typeof p === 'string')
        .join(' ')
        .toLowerCase()
}

function inferVerb(text: string): string | null {
    if (/\b(delete|eliminar|remove|apagar|destroy)\b/.test(text)) return 'delete'
    if (/\b(clear|limpar|reset|repor|clean|erase)\b/.test(text)) return 'clear'
    if (/\b(publish|publicar)\b/.test(text)) return 'publish'
    if (/\b(approve|aprovar|confirm)\b/.test(text)) return 'approve'
    if (/\b(edit|editar|update|atualizar)\b/.test(text)) return 'update'
    if (/\b(create|criar|new|novo|add|adicionar)\b/.test(text)) return 'create'
    if (/\b(export|download|descarregar)\b/.test(text)) return 'export'
    if (/\b(audit|auditar)\b/.test(text)) return 'audit'
    if (/\b(view|ver|read|listar|list)\b/.test(text)) return 'view'
    if (/\b(manage|gerir|admin)\b/.test(text)) return 'manage'
    return null
}

function defaultAction(ctx: SuggestionContext): PermissionRuleSuggestion['action'] {
    if (ctx.isRoot) return 'assert'
    const name = ctx.componentName?.toLowerCase() ?? ''
    if (INPUT_COMPONENTS.has(name) || name.startsWith('input')) return 'disable'
    if (BUTTON_LIKE.has(name)) {
        const variant = String(ctx.properties?.variant ?? '').toLowerCase()
        if (variant === 'destructive') return 'hide'
        return 'hide'
    }
    return 'hide'
}

function buildKey(verb: string, scope: string): string {
    if (verb === 'manage') return 'manage_access'
    if (verb === 'view' && scope === 'tax') return 'view_tax_id'
    return `${verb}_${scope}`
}

function findCatalogKey(
    catalog: PermissionCatalogEntry[],
    key: string
): PermissionCatalogEntry | undefined {
    return catalog.find((e) => e.key === key)
}

function suggestionFromKey(
    key: string,
    action: PermissionRuleSuggestion['action'],
    catalog: PermissionCatalogEntry[],
    reason: string,
    confidence: PermissionRuleSuggestion['confidence'],
    disabledProp?: string
): PermissionRuleSuggestion {
    const entry = findCatalogKey(catalog, key)
    return {
        permission: [key],
        action,
        disabledProp,
        confidence,
        reason,
        createIfMissing: !entry,
        label: entry?.label
    }
}

function elementDisplayLabel(ctx: SuggestionContext): string {
    const content = ctx.properties?.content
    if (typeof content === 'string' && content.trim()) {
        if (BUTTON_LIKE.has(ctx.componentName)) return content.trim()
        return `${content.trim()} (${ctx.componentName})`
    }
    if (ctx.label?.trim()) return ctx.label.trim()
    if (ctx.tag) return ctx.tag
    return ctx.componentName
}

export function suggestPermissionRule(
    ctx: SuggestionContext,
    catalog: PermissionCatalogEntry[]
): PermissionSuggestionResult {
    const elementLabel = elementDisplayLabel(ctx)
    const scope = deriveScope(ctx.pageName, ctx.tag)
    const text = collectText(ctx)
    const verb = inferVerb(text)
    const action = defaultAction(ctx)
    const disabledProp = action === 'disable' ? 'readOnly' : undefined

    if (ctx.isRoot) {
        const manage = findCatalogKey(catalog, 'manage_access')
        return {
            elementLabel,
            recommended: suggestionFromKey(
                manage?.key ?? `manage_${scope}`,
                'assert',
                catalog,
                `Page or component root gate for ${elementLabel}`,
                'high'
            ),
            alternatives: []
        }
    }

    if (INPUT_COMPONENTS.has(ctx.componentName) || ctx.componentName.startsWith('input')) {
        const viewKey = scope.includes('tax') ? 'view_tax_id' : `view_${scope}`
        return {
            elementLabel,
            recommended: suggestionFromKey(
                findCatalogKey(catalog, viewKey)?.key ?? viewKey,
                'disable',
                catalog,
                `Form field on ${elementLabel}`,
                'high',
                'readOnly'
            ),
            alternatives: [
                suggestionFromKey(
                    findCatalogKey(catalog, `update_${scope}`)?.key ?? `update_${scope}`,
                    'disable',
                    catalog,
                    'Restrict editing',
                    'medium',
                    'readOnly'
                )
            ]
        }
    }

    if (!verb) {
        if (BUTTON_LIKE.has(ctx.componentName)) {
            const updateKey = findCatalogKey(catalog, `update_${scope}`)?.key ?? `update_${scope}`
            return {
                elementLabel,
                recommended: suggestionFromKey(
                    updateKey,
                    'hide',
                    catalog,
                    `Gate action on ${elementLabel}`,
                    'medium'
                ),
                alternatives: [
                    suggestionFromKey(
                        findCatalogKey(catalog, `view_${scope}`)?.key ?? `view_${scope}`,
                        'disable',
                        catalog,
                        'Read-only without view permission',
                        'low'
                    )
                ]
            }
        }

        return {
            elementLabel,
            recommended: null,
            alternatives: catalog
                .filter((e) => e.usageCount > 0)
                .slice(0, 3)
                .map((e) =>
                    suggestionFromKey(e.key, action, catalog, `Frequently used: ${e.label}`, 'low')
                )
        }
    }

    if (verb === 'clear') {
        const updateKey = findCatalogKey(catalog, `update_${scope}`)?.key ?? `update_${scope}`
        return {
            elementLabel,
            recommended: suggestionFromKey(
                updateKey,
                'hide',
                catalog,
                `Clear/reset control — requires edit permission`,
                'high'
            ),
            alternatives: [
                suggestionFromKey(
                    updateKey,
                    'disable',
                    catalog,
                    'Disable instead of hide when missing permission',
                    'medium'
                ),
                suggestionFromKey(
                    findCatalogKey(catalog, `view_${scope}`)?.key ?? `view_${scope}`,
                    'disable',
                    catalog,
                    'Read-only: block clear action',
                    'low'
                )
            ]
        }
    }

    const primaryKey = buildKey(verb, scope)
    let recommendedAction = action
    if (verb === 'publish') recommendedAction = 'hide'
    if (verb === 'approve') recommendedAction = 'replace'
    if (verb === 'audit' && BUTTON_LIKE.has(ctx.componentName)) recommendedAction = 'disable'

    const recommended = suggestionFromKey(
        findCatalogKey(catalog, primaryKey)?.key ?? primaryKey,
        recommendedAction,
        catalog,
        `Suggested for ${elementLabel}`,
        'high',
        recommendedAction === 'disable' ? disabledProp : undefined
    )

    const alternatives: PermissionRuleSuggestion[] = []

    if (verb === 'delete') {
        const audit = findCatalogKey(catalog, 'audit_invoice') ?? findCatalogKey(catalog, `audit_${scope}`)
        if (audit) {
            alternatives.push(
                suggestionFromKey(audit.key, 'disable', catalog, 'Allow view but block action', 'medium')
            )
        }
    }

    if (verb === 'publish') {
        alternatives.push(
            suggestionFromKey(
                findCatalogKey(catalog, primaryKey)?.key ?? primaryKey,
                'replace',
                catalog,
                'Show approval fallback when missing permission',
                'medium'
            )
        )
    }

    if (verb === 'update') {
        alternatives.push(
            suggestionFromKey(
                findCatalogKey(catalog, `view_${scope}`)?.key ?? `view_${scope}`,
                'disable',
                catalog,
                'Read-only without update permission',
                'medium',
                'readOnly'
            )
        )
    }

    return {
        elementLabel,
        recommended,
        alternatives: alternatives.slice(0, 3)
    }
}

export function applySuggestionToDraft(
    suggestion: PermissionRuleSuggestion
): {
    permission: string[]
    action: PermissionRuleSuggestion['action']
    mode?: 'all' | 'any'
    disabledProp?: string
} {
    return {
        permission: [...suggestion.permission],
        action: suggestion.action,
        disabledProp: suggestion.disabledProp
    }
}
