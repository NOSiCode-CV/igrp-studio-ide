import type { GitProviderType } from '../types'

export interface GitProviderTypeDescriptor {
    type: GitProviderType
    label: string
    /** Default host used when the user picks the canonical instance. */
    defaultHost: string
    /** OAuth scopes requested when connecting through this provider type. */
    scopes: string[]
    /** Web → OAuth URL builder (paths relative to the host). */
    oauthPaths: {
        authorize: string
        token: string
    }
    /**
     * Map a web host to the REST API base URL. Most providers expose a
     * sub-path for self-hosted instances (e.g. /api/v3 for GitHub
     * Enterprise) and a dedicated host for the canonical instance
     * (api.github.com).
     */
    apiUrlFor(webHost: string): string
}

const GITHUB: GitProviderTypeDescriptor = {
    type: 'github',
    label: 'GitHub',
    defaultHost: 'https://github.com',
    scopes: ['repo', 'read:user', 'read:org'],
    oauthPaths: {
        authorize: '/login/oauth/authorize',
        token: '/login/oauth/access_token'
    },
    apiUrlFor(webHost) {
        const host = webHost.replace(/\/+$/, '')
        return host === GITHUB.defaultHost ? 'https://api.github.com' : `${host}/api/v3`
    }
}

const GITLAB: GitProviderTypeDescriptor = {
    type: 'gitlab',
    label: 'GitLab',
    defaultHost: 'https://gitlab.com',
    scopes: ['api', 'read_user', 'read_repository'],
    oauthPaths: {
        authorize: '/oauth/authorize',
        token: '/oauth/token'
    },
    apiUrlFor(webHost) {
        // GitLab self-managed exposes the same API path as gitlab.com.
        return webHost.replace(/\/+$/, '')
    }
}

export const GIT_PROVIDER_TYPES: GitProviderTypeDescriptor[] = [GITHUB, GITLAB]

/**
 * Lookup helper. Returns undefined when the type is unknown so callers
 * can decide whether to throw or fall back gracefully.
 */
export function describeProviderType(
    type: GitProviderType
): GitProviderTypeDescriptor | undefined {
    return GIT_PROVIDER_TYPES.find((p) => p.type === type)
}
