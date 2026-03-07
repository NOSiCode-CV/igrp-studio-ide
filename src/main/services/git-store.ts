import type { GitProviderConfig } from '../types'

let store: any = null

export const GitStore = {
    async initialize() {
        const Store = (await import('electron-store')).default
        store = new Store({
            name: 'igrp-studio-auth',
            clearInvalidConfig: true
        })
    },

    setAutoCommit(prompt: boolean) {
        store?.set(`auto-commit`, prompt)
    },

    isAutoCommit(): boolean {
        return store?.get(`auto-commit`)
    },

    setToken(service: 'github' | 'gitlab', token: any) {
        store?.set(`${service}_token`, token)
    },

    getToken(service: 'github' | 'gitlab'): string | null {
        const token = store?.get(`${service}_token`)
        return token || null
    },

    logoutGithub() {
        store?.delete('github_token')
    },

    logoutGitlab() {
        store?.delete('gitlab_token')
    },

    setProjectPath(repoId: number, path: string) {
        const projectPaths = store.get('project_paths', {})
        store.set('project_paths', {
            ...projectPaths,
            [repoId]: path
        })
    },

    getProjectPath(repoId: number): string | null {
        const projectPaths = store.get('project_paths', {})
        return projectPaths[repoId] || null
    },

    addClonedRepo(repoId: number) {
        const clonedRepos = store.get('cloned_repos', [])
        if (!clonedRepos.includes(repoId)) {
            store.set('cloned_repos', [...clonedRepos, repoId])
        }
    },

    removeClonedRepo(repoId: number): void {
        const clonedRepos = this.getClonedRepos()
        const updatedRepos = clonedRepos.filter((id) => id !== repoId)
        if (updatedRepos.length !== clonedRepos.length) {
            store.set('cloned_repos', updatedRepos)
        }
    },

    getClonedRepos(): number[] {
        const repos = store.get('cloned_repos', [])
        return repos || []
    },

    getProjectPaths(): Record<number, string> {
        return store.get('project_paths', {})
    },

    getGitlabConfigs: (): GitProviderConfig[] =>
        store.get('gitlabConfigs', []) as GitProviderConfig[],

    saveGitlabConfig: (config: GitProviderConfig) => {
        const configs = GitStore.getGitlabConfigs()
        const existingIndex = configs.findIndex((c) => c.id === config.id)

        let newConfigs
        if (existingIndex !== -1) {
            configs[existingIndex] = config // Atualiza o existente
            newConfigs = [...configs]
        } else {
            newConfigs = [...configs, config] // Adiciona novo
        }

        store.set('gitlabConfigs', newConfigs)
    },

    setActiveGitlabConfig: (id: string) => {
        const configs = GitStore.getGitlabConfigs().map((c) => ({
            ...c,
            active: c.id === id
        }))
        store.set('gitlabConfigs', configs)
    }
}
