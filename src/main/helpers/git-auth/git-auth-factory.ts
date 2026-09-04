import { describeProviderType } from '../../config/git-providers'
import { GitStore } from '../../services/git-store'
import { GitHubService } from '../../services/github-service'
import { GitLabService } from '../../services/gitlab-service'
import type { GitProviderConfig, GitProviderType } from '../../types'
import { GitAuth } from './git-auth'

function trimTrailingSlash(url: string): string {
    return url.replace(/\/+$/, '')
}

/**
 * Build the OAuth authorize/token endpoints for a provider from the
 * declarative descriptor + the stored web host.
 */
function buildEndpoints(type: GitProviderType, baseUrl: string) {
    const desc = describeProviderType(type)
    if (!desc) {
        throw new Error(`Unknown git provider type: ${type}`)
    }
    const host = trimTrailingSlash(baseUrl || desc.defaultHost)
    return {
        authUrl: `${host}${desc.oauthPaths.authorize}`,
        tokenUrl: `${host}${desc.oauthPaths.token}`,
        scopes: desc.scopes
    }
}

/**
 * Build a GitAuth instance for any persisted GitProviderConfig. Used by
 * the OAuth IPC handlers when a configId is provided so users can
 * authenticate against custom hosts (GitHub Enterprise, GitLab self-
 * managed) without shipping new code.
 */
export function buildGitAuth(config: GitProviderConfig): GitAuth {
    const type: GitProviderType = config.type ?? 'gitlab'
    const { authUrl, tokenUrl, scopes } = buildEndpoints(type, config.baseUrl)
    const desc = describeProviderType(type)!
    const service = type === 'github' ? GitHubService : GitLabService

    return new GitAuth(
        {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            scopes,
            authUrl,
            tokenUrl,
            provider: type,
            baseUrl: trimTrailingSlash(config.baseUrl || desc.defaultHost),
            configId: config.id
        },
        GitStore,
        service
    )
}

const NOSI_GITLAB_ID = 'gitlab-nosi'

function envGitlabDefault(): GitProviderConfig | null {
    const clientId = process.env.VITE_GITLAB_CLIENT_ID || ''
    const clientSecret = process.env.VITE_GITLAB_CLIENT_SECRET || ''
    if (!clientId || !clientSecret) return null
    const baseUrl = (
        process.env.VITE_GITLAB_BASE_URL ||
        process.env.VITE_GITLAB_HOST ||
        'https://git.nosi.cv'
    ).replace(/\/+$/, '')
    return {
        id: NOSI_GITLAB_ID,
        type: 'gitlab',
        name: 'GitLab NOSi',
        baseUrl,
        clientId,
        clientSecret,
        active: true,
        isDefault: true
    }
}

export function getActiveProviderConfig(type: GitProviderType): GitProviderConfig | null {
    const configs = GitStore.getProviderConfigs(type)
    return configs.find((c) => c.active) ?? null
}

export function getProviderConfigById(id: string): GitProviderConfig | null {
    const configs = GitStore.getProviderConfigs()
    const found = configs.find((c) => c.id === id)
    if (found) return found
    if (id === NOSI_GITLAB_ID) return envGitlabDefault()
    return null
}
