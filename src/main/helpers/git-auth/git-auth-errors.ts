import type { GitProviderType } from '../../types'

/**
 * Thrown by GitHubService / GitLabService when an API call fails because
 * the OAuth token is no longer valid (401 / 403). Lets IPC handlers
 * surface a structured signal to the renderer instead of opaque errors.
 */
export class GitAuthExpiredError extends Error {
    readonly providerType: GitProviderType
    readonly status: number

    constructor(providerType: GitProviderType, status: number, message?: string) {
        super(message ?? `${providerType} token expired (HTTP ${status})`)
        this.name = 'GitAuthExpiredError'
        this.providerType = providerType
        this.status = status
    }
}

/**
 * Best-effort detection of 401 / 403 across both Octokit and Gitbeaker
 * client error shapes.
 */
export function isAuthError(error: unknown): { match: boolean; status: number } {
    if (!error || typeof error !== 'object') return { match: false, status: 0 }
    const e = error as { status?: number; response?: { status?: number }; cause?: { response?: { status?: number } } }
    const status = e.status ?? e.response?.status ?? e.cause?.response?.status ?? 0
    return { match: status === 401 || status === 403, status }
}
