import type { BrowserWindow } from 'electron'
import { describeProviderType } from '../config/git-providers'
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
                await this.initialize(token)
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
            return true
        } catch (error) {
            console.error('Failed to initialize GitHub client:', error)
            octokit = null
            throw error
        }
    },

    async getUserInfo() {
        if (!octokit) return null

        const online = await isOnline()
        if (!online) throw new Error('ERR_INTERNET_DISCONNECTED')

        const { data } = await octokit?.users?.getAuthenticated()
        return data
    },

    async listIGRPStudioRepositoriesGithub(_window: BrowserWindow) {
        try {
            const igrpRepos: any = []
            const batchSize = 10

            if (!octokit) return []

            const online = await isOnline()
            if (!online) throw new Error('ERR_INTERNET_DISCONNECTED')

            const { data: repos } = await octokit.repos?.listForAuthenticatedUser({
                sort: 'updated',
                per_page: 100,
                page: 1,
                visibility: 'all'
            })

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

            return igrpRepos
        } catch (error) {
            throw error
        }
    }
}
