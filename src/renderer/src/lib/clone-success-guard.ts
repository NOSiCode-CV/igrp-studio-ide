/**
 * Cross-component dedupe for clone-progress success handling.
 *
 * Several UI surfaces (clone modal, git project list, repository list) can
 * subscribe to the same IPC event at once. Without a shared claim, each
 * handler would toast + saveOrOpenProject for a single clone.
 */
const claimedPaths = new Set<string>()
const CLAIM_TTL_MS = 60_000

export function claimCloneSuccess(path: string | undefined | null): boolean {
    if (!path) return false
    if (claimedPaths.has(path)) return false
    claimedPaths.add(path)
    window.setTimeout(() => claimedPaths.delete(path), CLAIM_TTL_MS)
    return true
}
