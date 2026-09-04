import { Gitlab } from '@gitbeaker/rest'
import type { BrowserWindow } from 'electron'
import { GitAuthExpiredError, isAuthError } from '../helpers/git-auth/git-auth-errors'
import {
    clearRepoCache,
    isRateLimitError,
    readRepoCache,
    writeRepoCache
} from '../helpers/git-auth/repo-cache'
import { isOnline } from '../helpers/network-utils'
import type { GitProviderConfig } from '../types'
import { GitStore } from './git-store'

let gitlab: any = null

function asProjectList(repos: unknown): any[] {
    return Array.isArray(repos) ? repos : []
}

function mapGitlabProject(repo: any) {
    const namespace = repo.namespace
    return {
        id: repo.id,
        name: repo.name,
        full_name: repo.path_with_namespace,
        description: repo.description ?? null,
        private: repo.visibility !== 'public',
        html_url: repo.web_url,
        clone_url: repo.http_url_to_repo,
        updated_at: repo.last_activity_at ?? null,
        owner: namespace?.path ?? namespace?.full_path ?? namespace?.name ?? '',
        default_branch: repo.default_branch || 'main',
        platform: 'gitlab' as const
    }
}

export const GitLabService = {
    async initializeServices() {
        try {
            const token = GitStore.getToken('gitlab')

            if (token) {
                const host = GitStore.getProviderHost('gitlab')
                await this.initialize(token, host || undefined)
                return true
            }
        } catch (error) {
            console.error('Failed to initialize GitLab service:', error)
        }
        return false
    },

    /**
     * @param token   OAuth access token
     * @param baseUrl Optional GitLab host (e.g. https://git.nosi.cv).
     *                When omitted: last persisted host, then VITE_GITLAB_BASE_URL,
     *                then VITE_GITLAB_HOST (legacy).
     */
    async initialize(token: string, baseUrl?: string) {
        try {
            const host = (
                baseUrl ||
                GitStore.getProviderHost('gitlab') ||
                process.env.VITE_GITLAB_BASE_URL ||
                process.env.VITE_GITLAB_HOST ||
                'https://git.nosi.cv'
            ).replace(/\/+$/, '')
            gitlab = new Gitlab({
                oauthToken: token,
                host
            })

            GitStore.setToken('gitlab', token)
            GitStore.setProviderHost('gitlab', host)
            clearRepoCache('gitlab')

            return true
        } catch (error) {
            console.error('Failed to initialize GitLab client:', error)
            gitlab = null
            const auth = isAuthError(error)
            if (auth.match) throw new GitAuthExpiredError('gitlab', auth.status)
            throw error
        }
    },

    logout() {
        gitlab = null
        GitStore.logoutGitlab()
        clearRepoCache('gitlab')
    },

    async getUserInfo() {
        if (!gitlab) throw new Error('GitLab client not initialized')

        const online = await isOnline()
        if (!online) throw new Error('ERR_INTERNET_DISCONNECTED')

        try {
            const user = await gitlab.Users.showCurrentUser()
            return JSON.parse(JSON.stringify(user))
        } catch (error) {
            const auth = isAuthError(error)
            if (auth.match) throw new GitAuthExpiredError('gitlab', auth.status)
            throw error
        }
    },

    async listIGRPStudioRepositoriesGitlab(_window: BrowserWindow) {
        if (!gitlab) return []

        const cached = readRepoCache<any[]>('gitlab')
        if (cached) return cached

        try {
            const online = await isOnline()
            if (!online) throw new Error('ERR_INTERNET_DISCONNECTED')

            const repos = asProjectList(
                await gitlab.Projects.all({
                    membership: true,
                    orderBy: 'last_activity_at',
                    sort: 'desc',
                    perPage: 100
                })
            )

            const mapped = repos.map(mapGitlabProject)
            if (mapped.length > 0) writeRepoCache('gitlab', mapped)
            return mapped
        } catch (error) {
            console.error('Error listing GitLab repositories:', error)
            const auth = isAuthError(error)
            if (auth.match) throw new GitAuthExpiredError('gitlab', auth.status)
            if (isRateLimitError(error)) {
                const err = new Error('GITLAB_RATE_LIMITED')
                ;(err as any).code = 'RATE_LIMITED'
                ;(err as any).providerType = 'gitlab'
                throw err
            }
            throw error
        }
    },

    async getGitlabConfigs(): Promise<GitProviderConfig[]> {
        return GitStore.getGitlabConfigs()
    },

    async saveGitlabConfig(config: GitProviderConfig) {
        GitStore.saveGitlabConfig(config)
    },

    async setActiveGitlabConfig(id: string) {
        GitStore.setActiveGitlabConfig(id)
    },

    async removeGitlabConfig(id: string) {
        GitStore.removeGitlabConfig(id)
    }
}
