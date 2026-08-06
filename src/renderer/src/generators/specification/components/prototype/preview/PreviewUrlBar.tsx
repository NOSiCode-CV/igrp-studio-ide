import { useCallback, useEffect, useRef, useState, type JSX } from 'react'

/**
 * Editable URL bar above the webview preview.
 *
 * Read-only display in M4.7 became a friction point as soon as the
 * user generated a second page — the engine wrote
 * `app/pages/<name>/page.tsx` but the webview stayed at `/`. The user
 * had no way to type a URL or pick a page. This input + the adjacent
 * `Pages ▾` dropdown solve that.
 *
 * External URL changes (auto-navigate after generation, reload, page
 * picked from the dropdown) re-sync the draft — but only when the
 * external value actually changed AND it doesn't match the current
 * draft. That avoids clobbering whatever the user is mid-typing.
 *
 * Submit calls `webview.loadURL(...)` directly; we don't dispatch
 * through Redux because the webview owns its own navigation state.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P4 — preview chrome).
 */
export const PreviewUrlBar = ({ url }: { url: string | null }): JSX.Element => {
    const [draft, setDraft] = useState<string>(url ?? '')
    const lastUrlRef = useRef(url)
    // Sync external URL updates (auto-navigate after generation, reload,
    // user picks from Pages dropdown). Don't clobber a draft the user is
    // actively typing: we only re-sync when the external URL changed AND
    // it doesn't match the current draft.
    useEffect(() => {
        if (url !== lastUrlRef.current) {
            lastUrlRef.current = url
            setDraft(url ?? '')
        }
    }, [url])

    const navigate = useCallback((target: string) => {
        const view = document.querySelector('webview.spec-prototype-preview') as {
            loadURL?: (u: string) => void
        } | null
        view?.loadURL?.(target)
    }, [])

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                if (!draft.trim()) return
                navigate(draft.trim())
            }}
            className="flex h-8 w-72 items-center rounded-md bg-muted px-2 text-[11px]"
        >
            <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="dev server stopped"
                disabled={!url}
                spellCheck={false}
                className="flex-1 bg-transparent font-mono text-[10.5px] text-muted-foreground outline-none disabled:cursor-not-allowed"
                title={url ?? 'dev server stopped'}
            />
        </form>
    )
}
