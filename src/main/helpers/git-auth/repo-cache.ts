import type { GitProviderType } from '../../types'

interface CacheEntry<T> {
    value: T
    fetchedAt: number
}

const TTL_MS = 5 * 60 * 1000 // 5 minutes

const repoCache: Map<string, CacheEntry<unknown>> = new Map()

function makeKey(providerType: GitProviderType, scope: string = 'default'): string {
    return `${providerType}:${scope}`
}

export function readRepoCache<T>(providerType: GitProviderType, scope?: string): T | null {
    const key = makeKey(providerType, scope)
    const entry = repoCache.get(key)
    if (!entry) return null
    if (Date.now() - entry.fetchedAt > TTL_MS) {
        repoCache.delete(key)
        return null
    }
    return entry.value as T
}

export function writeRepoCache<T>(providerType: GitProviderType, value: T, scope?: string): void {
    const key = makeKey(providerType, scope)
    repoCache.set(key, { value, fetchedAt: Date.now() })
}

export function clearRepoCache(providerType?: GitProviderType): void {
    if (!providerType) {
        repoCache.clear()
        return
    }
    for (const key of repoCache.keys()) {
        if (key.startsWith(`${providerType}:`)) repoCache.delete(key)
    }
}

/**
 * Detect HTTP 429 (rate limited) across Octokit and Gitbeaker shapes.
 * GitHub may also return 403 with a `x-ratelimit-remaining: 0` header,
 * which Octokit surfaces as status=403 + message containing 'rate limit'.
 */
export function isRateLimitError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const e = error as {
        status?: number
        response?: { status?: number; headers?: Record<string, string> }
        message?: string
    }
    const status = e.status ?? e.response?.status
    if (status === 429) return true
    if (status === 403) {
        const remaining =
            e.response?.headers?.['x-ratelimit-remaining'] ??
            e.response?.headers?.['x-ratelimit-remaining'.toLowerCase()]
        if (remaining === '0') return true
        if (e.message?.toLowerCase().includes('rate limit')) return true
    }
    return false
}
