/**
 * Map a Prototype manifest's `path` field onto a concrete URL the
 * Next.js dev server can serve.
 *
 * Two transformations matter:
 *
 *   - **Route groups** like `(parametrizacao)/categorias` → strip the
 *     `(parametrizacao)/` segment. Route groups are organisational;
 *     they don't appear in the URL.
 *
 *   - **Dynamic segments** like `caixa/dias/[uuid]/atendedores/novo` →
 *     replace `[uuid]` (and friends, including `[...slug]` catch-alls
 *     and `[[...slug]]` optional catch-alls) with the literal
 *     `"preview"` so the URL resolves to a concrete route.
 *
 * The IGRP framework template wraps engine-generated pages in
 * `src/app/(igrp)/(generated)/<name>/page.tsx`. Both `(igrp)` and
 * `(generated)` are route groups, so they don't appear in the URL —
 * the `users` page is served at `/users`, not `/generated/users`. No
 * prefix needed in the computed URL.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P2 — pure helper functions).
 */
export function computePreviewUrl(
    devUrl: string | null,
    manifest: { pageName?: string; path?: string } | null | undefined
): string | null {
    if (!devUrl || !manifest) return null
    // Prefer `path` when it has actual segments; fall back to `pageName`.
    const rawPath =
        typeof manifest.path === 'string' && manifest.path.trim().length > 0
            ? manifest.path
            : manifest.pageName
    if (!rawPath) return null
    const normalised = rawPath
        .replace(/\([^)]*\)\//g, '') // strip route groups
        .replace(/\[\[\.\.\.[^\]]*\]\]/g, 'preview') // optional catch-alls
        .replace(/\[\.\.\.[^\]]*\]/g, 'preview') // catch-alls
        .replace(/\[[^\]]*\]/g, 'preview') // dynamic segments
        .replace(/^\/+/, '') // belt-and-braces strip leading slash
    const base = devUrl.replace(/\/+$/, '')
    return `${base}/${normalised}`
}
