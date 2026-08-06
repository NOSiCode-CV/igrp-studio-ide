export interface RouteSegment {
    name: string
    type: 'static' | 'dynamic' | 'catch-all' | 'optional-catch-all' | 'route-group'
    required: boolean
    originalSegment: string
}

/** Sentinel for pages/components with no `(group)` prefix. */
export const UNGROUPED_ROUTE_GROUP = '__ungrouped__'

export function parseRoutePath(path: string): RouteSegment[] {
    // Remove leading slash and split by /
    const segments = path.replace(/^\//, '').split('/').filter(Boolean)

    return segments.map((segment) => {
        // Route groups: (auth), (dashboard)
        if (segment.startsWith('(') && segment.endsWith(')')) {
            return {
                name: segment.slice(1, -1),
                type: 'route-group' as const,
                required: false,
                originalSegment: segment
            }
        }

        // Optional catch-all: [[...slug]]
        if (segment.startsWith('[[...') && segment.endsWith(']]')) {
            const name = segment.slice(5, -2)
            return {
                name,
                type: 'optional-catch-all' as const,
                required: false,
                originalSegment: segment
            }
        }

        // Catch-all: [...slug]
        if (segment.startsWith('[...') && segment.endsWith(']')) {
            const name = segment.slice(4, -1)
            return {
                name,
                type: 'catch-all' as const,
                required: true,
                originalSegment: segment
            }
        }

        // Dynamic: [id], [slug]
        if (segment.startsWith('[') && segment.endsWith(']')) {
            const name = segment.slice(1, -1)
            return {
                name,
                type: 'dynamic' as const,
                required: true,
                originalSegment: segment
            }
        }

        // Static segment
        return {
            name: segment,
            type: 'static' as const,
            required: true,
            originalSegment: segment
        }
    })
}

export function getDynamicSegments(path?: string): RouteSegment[] {
    if (!path) return []
    const segments = parseRoutePath(path)
    return segments.filter(
        (segment) =>
            segment.type === 'dynamic' ||
            segment.type === 'catch-all' ||
            segment.type === 'optional-catch-all'
    )
}

export function getStaticSegments(path: string): RouteSegment[] {
    const segments = parseRoutePath(path)
    return segments.filter((segment) => segment.type === 'static')
}

/** First Next.js route-group name in the path, e.g. `(contribuicoes)/x` → `contribuicoes`. */
export function getRouteGroup(path?: string | null): string | null {
    if (!path) return null
    const group = parseRoutePath(path).find((segment) => segment.type === 'route-group')
    return group?.name || null
}

/** Strip a leading `(group)/` (or lone `(group)`) from a path. */
export function stripRouteGroup(path?: string | null): string {
    if (!path) return ''
    return path
        .replace(/^\//, '')
        .replace(/^\([^/)]+\)\//, '')
        .replace(/^\([^/)]+\)$/, '')
}

/**
 * Prefix path with `(group)/` when a group is set.
 * Replaces any existing leading route-group.
 */
export function withRouteGroup(path: string, group: string | null | undefined): string {
    const rest = stripRouteGroup(path)
    if (!group) return rest
    const slug = group.replace(/[()]/g, '').trim()
    if (!slug) return rest
    return rest ? `(${slug})/${rest}` : `(${slug})`
}

export function pathBelongsToGroup(path: string | null | undefined, filter: string): boolean {
    if (!filter || filter === 'all') return true
    const group = getRouteGroup(path)
    if (filter === UNGROUPED_ROUTE_GROUP) return !group
    return group === filter
}

/** Unique sorted route-group names found across page/component paths. */
export function listRouteGroups(paths: Array<string | null | undefined>): string[] {
    const set = new Set<string>()
    for (const path of paths) {
        const group = getRouteGroup(path)
        if (group) set.add(group)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
}
