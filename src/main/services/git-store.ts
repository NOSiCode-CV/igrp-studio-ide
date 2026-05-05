import { safeStorage } from 'electron'
import { validateProviderConfig } from '../config/git-provider-schema'
import type { GitProviderConfig, GitProviderType } from '../types'

let store: any = null

const ENCRYPTED_PREFIX = 'enc:v1:'
const PROVIDER_CONFIGS_KEY = 'providerConfigs'
const LEGACY_GITLAB_CONFIGS_KEY = 'gitlabConfigs'

function encryptValue(value: string): string {
    if (!value) return value
    if (safeStorage.isEncryptionAvailable()) {
        const buf = safeStorage.encryptString(value)
        return ENCRYPTED_PREFIX + buf.toString('base64')
    }
    return value
}

function decryptValue(value: string | null | undefined): string | null {
    if (!value || typeof value !== 'string') return null
    if (!value.startsWith(ENCRYPTED_PREFIX)) return value
    const payload = value.slice(ENCRYPTED_PREFIX.length)
    try {
        return safeStorage.decryptString(Buffer.from(payload, 'base64'))
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

/** Older configs were saved without `type` and only held GitLab instances. */
function normalizeConfig(c: GitProviderConfig): GitProviderConfig {
    return { ...c, type: c.type ?? 'gitlab' }
}

function readProviderConfigs(): GitProviderConfig[] {
    if (!store) return []
    let stored = (store.get(PROVIDER_CONFIGS_KEY, null) as GitProviderConfig[] | null) ?? null
    if (!stored) {
        // One-time migration from the legacy gitlab-only key.
        const legacy = (store.get(LEGACY_GITLAB_CONFIGS_KEY, []) as GitProviderConfig[]) ?? []
        if (legacy.length > 0) {
            stored = legacy.map(normalizeConfig)
            store.set(PROVIDER_CONFIGS_KEY, stored)
        } else {
            stored = []
        }
    }
    return stored.map(normalizeConfig)
}

function writeProviderConfigs(configs: GitProviderConfig[]): void {
    store?.set(PROVIDER_CONFIGS_KEY, configs)
    // Keep the legacy mirror in sync so an older app version (rolled back)
    // still sees the GitLab entries it knew about.
    const gitlabOnly = configs.filter((c) => (c.type ?? 'gitlab') === 'gitlab')
    store?.set(LEGACY_GITLAB_CONFIGS_KEY, gitlabOnly)
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

    /* ------------------------------------------------------------------ */
    /*  Generic provider config API                                       */
    /* ------------------------------------------------------------------ */

    /** Returns all stored provider configs, decrypted. */
    getProviderConfigs(type?: GitProviderType): GitProviderConfig[] {
        const all = readProviderConfigs().map(decryptConfigSecret)
        return type ? all.filter((c) => (c.type ?? 'gitlab') === type) : all
    },

    saveProviderConfig(config: GitProviderConfig): void {
        const normalized = normalizeConfig(config)
        const validation = validateProviderConfig(normalized)
        if (!validation.success) {
            const summary = validation.errors
                ?.map((e) => `${e.field}: ${e.message}`)
                .join('; ')
            throw new Error(`Invalid provider config — ${summary}`)
        }
        const stored = readProviderConfigs()
        const encrypted = encryptConfigSecret(normalized)
        const idx = stored.findIndex((c) => c.id === normalized.id)
        const next = [...stored]
        if (idx === -1) next.push(encrypted)
        else next[idx] = encrypted
        writeProviderConfigs(next)
    },

    removeProviderConfig(id: string): void {
        const stored = readProviderConfigs()
        const next = stored.filter((c) => c.id !== id)
        if (next.length !== stored.length) writeProviderConfigs(next)
    },

    /**
     * Marks one config as active. If `scopeToType` is true (default), only
     * configs of the same type are deactivated so users can keep one active
     * GitHub instance alongside one active GitLab instance.
     */
    setActiveProviderConfig(id: string, scopeToType: boolean = true): void {
        const stored = readProviderConfigs()
        const target = stored.find((c) => c.id === id)
        if (!target) return
        const next = stored.map((c) => {
            if (scopeToType && (c.type ?? 'gitlab') !== (target.type ?? 'gitlab')) return c
            return { ...c, active: c.id === id }
        })
        writeProviderConfigs(next)
    },

    /* ------------------------------------------------------------------ */
    /*  Legacy GitLab-only aliases (kept for backwards compatibility)     */
    /* ------------------------------------------------------------------ */

    getGitlabConfigs: (): GitProviderConfig[] => GitStore.getProviderConfigs('gitlab'),
    saveGitlabConfig: (config: GitProviderConfig) =>
        GitStore.saveProviderConfig({ ...config, type: 'gitlab' }),
    removeGitlabConfig: (id: string) => GitStore.removeProviderConfig(id),
    setActiveGitlabConfig: (id: string) => GitStore.setActiveProviderConfig(id)
}
