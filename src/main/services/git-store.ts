import { safeStorage } from 'electron'
import type { GitProviderConfig } from '../types'

let store: any = null

const ENCRYPTED_PREFIX = 'enc:v1:'

/**
 * Encrypt a string with electron.safeStorage when available. Falls back to
 * the plaintext value (with a clear marker) on platforms where safeStorage
 * is unavailable so the data still loads if the user later updates Electron
 * or moves between OSes.
 */
function encryptValue(value: string): string {
    if (!value) return value
    if (safeStorage.isEncryptionAvailable()) {
        const buf = safeStorage.encryptString(value)
        return ENCRYPTED_PREFIX + buf.toString('base64')
    }
    return value
}

function decryptValue(value: string | null | undefined): string | null {
    if (!value) return null
    if (typeof value !== 'string') return null
    if (!value.startsWith(ENCRYPTED_PREFIX)) {
        // Legacy plaintext value or unsupported environment.
        return value
    }
    const payload = value.slice(ENCRYPTED_PREFIX.length)
    try {
        const buf = Buffer.from(payload, 'base64')
        return safeStorage.decryptString(buf)
    } catch (error) {
        console.error('[GitStore] Failed to decrypt value:', error)
        return null
    }
}

function encryptConfigSecret(config: GitProviderConfig): GitProviderConfig {
    if (!config.clientSecret) return config
    return { ...config, clientSecret: encryptValue(config.clientSecret) }
}

function decryptConfigSecret(config: GitProviderConfig): GitProviderConfig {
    if (!config.clientSecret) return config
    const decrypted = decryptValue(config.clientSecret)
    if (decrypted === null) return config
    return { ...config, clientSecret: decrypted }
}

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

    setToken(service: 'github' | 'gitlab', token: string | null | undefined) {
        if (!token) {
            store?.delete(`${service}_token`)
            return
        }
        store?.set(`${service}_token`, encryptValue(token))
    },

    getToken(service: 'github' | 'gitlab'): string | null {
        const raw = store?.get(`${service}_token`)
        return decryptValue(raw)
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

    getGitlabConfigs: (): GitProviderConfig[] => {
        const stored = (store.get('gitlabConfigs', []) as GitProviderConfig[]) ?? []
        return stored.map(decryptConfigSecret)
    },

    saveGitlabConfig: (config: GitProviderConfig) => {
        const stored = (store.get('gitlabConfigs', []) as GitProviderConfig[]) ?? []
        const encrypted = encryptConfigSecret(config)
        const existingIndex = stored.findIndex((c) => c.id === config.id)

        let newConfigs: GitProviderConfig[]
        if (existingIndex !== -1) {
            const next = [...stored]
            next[existingIndex] = encrypted
            newConfigs = next
        } else {
            newConfigs = [...stored, encrypted]
        }

        store.set('gitlabConfigs', newConfigs)
    },

    removeGitlabConfig: (id: string) => {
        const stored = (store.get('gitlabConfigs', []) as GitProviderConfig[]) ?? []
        const next = stored.filter((c) => c.id !== id)
        if (next.length !== stored.length) {
            store.set('gitlabConfigs', next)
        }
    },

    setActiveGitlabConfig: (id: string) => {
        const stored = (store.get('gitlabConfigs', []) as GitProviderConfig[]) ?? []
        const next = stored.map((c) => ({
            ...c,
            active: c.id === id
        }))
        store.set('gitlabConfigs', next)
    }
}
