import type { GitProviderConfig, GitProviderType } from '../../types'
import { GitStore } from '../../services/git-store'
import { GitHubService } from '../../services/github-service'
import { GitLabService } from '../../services/gitlab-service'
import { GitAuth } from './git-auth'

const GITHUB_SCOPES = ['repo', 'read:user', 'read:org']
const GITLAB_SCOPES = ['api', 'read_user', 'read_repository']

const DEFAULT_BASE_URLS: Record<GitProviderType, string> = {
    github: 'https://github.com',
    gitlab: 'https://gitlab.com'
}

function trimTrailingSlash(url: string): string {
    return url.replace(/\/+$/, '')
}

/**
 * Build the OAuth authorize/token endpoints for a provider from its base URL.
 * Mirrors the conventions used by the official hosts; self-hosted instances
 * (GitHub Enterprise, GitLab self-managed) follow the same paths.
 */
function buildEndpoints(type: GitProviderType, baseUrl: string) {
    const host = trimTrailingSlash(baseUrl || DEFAULT_BASE_URLS[type])
    if (type === 'github') {
        return {
            authUrl: `${host}/login/oauth/authorize`,
            tokenUrl: `${host}/login/oauth/access_token`
        }
    }
    return {
        authUrl: `${host}/oauth/authorize`,
        tokenUrl: `${host}/oauth/token`
    }
}

/**
 * Build a GitAuth instance for any persisted GitProviderConfig. Used by the
 * OAuth IPC handlers when a configId is provided so users can authenticate
 * against custom hosts (GitHub Enterprise, GitLab self-managed) without
 * shipping new code.
 */
export function buildGitAuth(config: GitProviderConfig): GitAuth {
    const type: GitProviderType = config.type ?? 'gitlab'
    const { authUrl, tokenUrl } = buildEndpoints(type, config.baseUrl)
    const scopes = type === 'github' ? GITHUB_SCOPES : GITLAB_SCOPES
    const service = type === 'github' ? GitHubService : GitLabService

    return new GitAuth(
        {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            scopes,
            authUrl,
            tokenUrl,
            provider: type,
            baseUrl: trimTrailingSlash(config.baseUrl || DEFAULT_BASE_URLS[type])
        },
        GitStore,
        service
    )
}

/**
 * Look up the active provider config for a given type. Returns null when no
 * config matches — callers should fall back to the env-based singleton in
 * that case.
 */
export function getActiveProviderConfig(type: GitProviderType): GitProviderConfig | null {
    const configs = GitStore.getProviderConfigs(type)
    return configs.find((c) => c.active) ?? null
}

/**
 * Look up a provider config by id (any type).
 */
export function getProviderConfigById(id: string): GitProviderConfig | null {
    const configs = GitStore.getProviderConfigs()
    return configs.find((c) => c.id === id) ?? null
}
