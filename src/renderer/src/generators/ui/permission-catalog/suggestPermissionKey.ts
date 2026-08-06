export interface PermissionKeySuggestionContext {
    projectName?: string
    pageName?: string
    componentTag?: string
    componentLabel?: string
    componentName?: string
    buttonContent?: string
}

function slugifySegment(value: string): string {
    return value
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_')
}

function deriveAppSegment(projectName?: string): string {
    if (!projectName?.trim()) return 'app'
    const tokens = slugifySegment(projectName).split('_').filter(Boolean)
    return tokens[0] ?? 'app'
}

function derivePageSegment(pageName?: string): string {
    if (!pageName?.trim()) return 'page'
    const slug = slugifySegment(pageName).replace(/_page$/, '')
    return slug || 'page'
}

function deriveActionSegment(ctx: PermissionKeySuggestionContext): string {
    const raw =
        ctx.buttonContent?.trim() ||
        ctx.componentTag?.trim() ||
        ctx.componentLabel?.trim() ||
        ctx.componentName?.trim() ||
        'action'

    const action = slugifySegment(raw)
        .replace(/^btn_/, '')
        .replace(/^button_/, '')

    return action || 'action'
}

function deriveLabel(ctx: PermissionKeySuggestionContext, action: string): string {
    if (ctx.buttonContent?.trim()) return ctx.buttonContent.trim()
    if (ctx.componentLabel?.trim()) return ctx.componentLabel.trim()
    if (ctx.componentTag?.trim()) {
        return ctx.componentTag
            .replace(/^btn_/, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function suggestPermissionKey(ctx: PermissionKeySuggestionContext = {}): {
    key: string
    label: string
} {
    const app = deriveAppSegment(ctx.projectName)
    const page = derivePageSegment(ctx.pageName)
    const action = deriveActionSegment(ctx)

    return {
        key: `${app}.${page}.${action}`,
        label: deriveLabel(ctx, action)
    }
}

export function permissionKeyPlaceholder(ctx: PermissionKeySuggestionContext = {}): string {
    return suggestPermissionKey(ctx).key
}
