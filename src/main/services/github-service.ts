import type { BrowserWindow } from 'electron'
import { describeProviderType } from '../config/git-providers'
import { GitAuthExpiredError, isAuthError } from '../helpers/git-auth/git-auth-errors'
import {
    clearRepoCache,
    isRateLimitError,
    readRepoCache,
    writeRepoCache
} from '../helpers/git-auth/repo-cache'
import { isOnline } from '../helpers/network-utils'
import { GitStore } from './git-store'

let octokit: any = null

function deriveApiUrl(webHost?: string): string | undefined {
    if (!webHost) return undefined
    return describeProviderType('github')?.apiUrlFor(webHost)
}

export const GitHubService = {
    async initializeServices() {
        try {
            const token = GitStore.getToken('github')

            if (token) {
                const host = GitStore.getProviderHost('github')
                await this.initialize(token, host || undefined)
                return true
            }
        } catch (error) {
            console.error('Failed to initialize GitHub service:', error)
        }
        return false
    },

    /**
     * @param token  OAuth access token
     * @param baseUrl Optional GitHub host (e.g. https://github.example.com).
     *                Pass it for GitHub Enterprise; omit for github.com.
     */
    async initialize(token: string, baseUrl?: string) {
        try {
            const online = await isOnline()
            if (!online) return false
            const { Octokit } = await import('@octokit/rest')
            const apiUrl = deriveApiUrl(baseUrl)
            octokit = new Octokit(apiUrl ? { auth: token, baseUrl: apiUrl } : { auth: token })
            await octokit.users.getAuthenticated()
            GitStore.setProviderHost('github', baseUrl || 'https://github.com')
            clearRepoCache('github')
            return true
        } catch (error) {
            console.error('Failed to initialize GitHub client:', error)
            octokit = null
            const auth = isAuthError(error)
            if (auth.match) throw new GitAuthExpiredError('github', auth.status)
            throw error
        }
    },

    logout() {
        octokit = null
        GitStore.logoutGithub()
        clearRepoCache('github')
    },

    async getUserInfo() {
        if (!octokit) return null

        const online = await isOnline()
        if (!online) throw new Error('ERR_INTERNET_DISCONNECTED')

        try {
            const { data } = await octokit?.users?.getAuthenticated()
            return data
        } catch (error) {
            const auth = isAuthError(error)
            if (auth.match) throw new GitAuthExpiredError('github', auth.status)
            throw error
        }
    },

    async listIGRPStudioRepositoriesGithub(_window: BrowserWindow) {
        if (!octokit) return []

        // Serve from cache when available — keeps the UI snappy and
        // protects the rate limit on rapid refreshes.
        const cached = readRepoCache<any[]>('github')
        if (cached) return cached

        try {
            const online = await isOnline()
            if (!online) throw new Error('ERR_INTERNET_DISCONNECTED')

            // octokit.paginate transparently walks the Link headers and
            // returns every page flattened, not just the first 100 repos.
            const repos: any[] = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
                sort: 'updated',
                per_page: 100,
                visibility: 'all'
            })

            const igrpRepos: any[] = []
            const batchSize = 10
            for (let i = 0; i < repos.length; i += batchSize) {
                const batch = repos.slice(i, i + batchSize)
                const promises = batch.map(async (repo) => {
                    try {
                        await octokit.repos.getContent({
                            owner: repo.owner.login,
                            repo: repo.name,
                            path: '.igrpstudio'
                        })
                        return {
                            id: repo.id,
                            name: repo.name,
                            full_name: repo.full_name,
                            description: repo.description,
                            private: repo.private,
                            html_url: repo.html_url,
                            clone_url: repo.clone_url,
                            updated_at: repo.updated_at,
                            owner: repo.owner.login,
                            platform: 'github'
                        }
                    } catch (error) {
                        if ((error as any).status !== 404) {
                            console.log(`Error checking repo ${repo.name}:`, error)
                        }
                        return null
                    }
                })
                const results = await Promise.all(promises)
                igrpRepos.push(...results.filter((r) => r !== null))
            }

            writeRepoCache('github', igrpRepos)
            return igrpRepos
        } catch (error) {
            const auth = isAuthError(error)
            if (auth.match) throw new GitAuthExpiredError('github', auth.status)
            if (isRateLimitError(error)) {
                // Surface a stable shape the renderer can recognise and
                // toast appropriately.
                const err = new Error('GITHUB_RATE_LIMITED')
                ;(err as any).code = 'RATE_LIMITED'
                ;(err as any).providerType = 'github'
                throw err
            }
            throw error
        }
    }
}
