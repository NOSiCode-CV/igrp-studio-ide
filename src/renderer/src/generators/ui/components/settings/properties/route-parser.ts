export interface RouteSegment {
    name: string
    type: 'static' | 'dynamic' | 'catch-all' | 'optional-catch-all' | 'route-group'
    required: boolean
    originalSegment: string
}

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
