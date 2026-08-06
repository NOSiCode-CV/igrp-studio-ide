import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import { loadPrototypeFiles } from '@renderer/redux/specPrototype/thunks'
import { ChevronDown, ExternalLink, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useDispatch, useSelector } from 'react-redux'

// IGRP framework template writes pages under
//   `src/app/(igrp)/(generated)/<name>/page.tsx`
// (route groups `(igrp)` and `(generated)` are organisational and don't
// appear in the URL). We also accept a few looser shapes so the dropdown
// stays populated if the engine ever emits a different layout:
//   - `src/app/(group1)/(group2)/<name>/page.tsx`   (current template)
//   - `src/app/<name>/page.tsx`                    (no groups)
//   - `app/pages/<name>/page.tsx`                  (legacy / non-`src`)
const PAGE_ROUTE_RE = /^(?:src\/)?app\/(?:pages\/)?(?:\([^)]+\)\/)*([^/]+)\/page\.tsx$/

/**
 * "Pages ▾" dropdown next to the URL bar. Lists every
 * `app/pages/<name>/page.tsx` the engine has generated in this
 * prototype; click → loads the corresponding URL in the webview.
 *
 * Picks up changes automatically because `state.specPrototype.files`
 * is refreshed on every `tree-changed` event. The dropdown also
 * re-fires `loadPrototypeFiles` on open so a freshly-generated page
 * lands quickly even if the IPC notification is in flight.
 *
 * The dropdown is *always* openable — empty / no-server states
 * surface as messages inside the popover instead of a dead button.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P4 — preview chrome).
 */
export const PagesDropdown = ({
    devUrl,
    basePath
}: {
    devUrl: string | null
    basePath: string | undefined
}): JSX.Element => {
    const dispatch = useDispatch<any>()
    const files = useSelector((s: RootState) => s.specPrototype.files)
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const pages = useMemo(() => {
        const seen = new Set<string>()
        const out: string[] = []
        for (const f of files) {
            const match = f.path.match(PAGE_ROUTE_RE)
            if (!match) continue
            const name = match[1]
            // Skip the root-level `app/page.tsx` (Next.js index) — only
            // care about distinct page folders.
            if (name === 'page.tsx') continue
            if (seen.has(name)) continue
            seen.add(name)
            out.push(name)
        }
        return out.sort()
    }, [files])

    useEffect(() => {
        if (!open) return
        const onClick = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [open])

    const navigate = useCallback(
        (pageName: string) => {
            if (!devUrl) return
            const view = document.querySelector('webview.spec-prototype-preview') as {
                loadURL?: (u: string) => void
            } | null
            // Route groups in the engine path (`(igrp)`, `(generated)`) do
            // NOT appear in the URL — Next.js serves the page at the
            // segment name directly. So `users` page lives at `/users`,
            // not `/pages/users`.
            view?.loadURL?.(`${devUrl.replace(/\/+$/, '')}/${pageName}`)
            setOpen(false)
        },
        [devUrl]
    )

    const refresh = useCallback(() => {
        if (basePath) dispatch(loadPrototypeFiles(basePath))
    }, [basePath, dispatch])

    // Dropdown is *always* openable now — empty / no-server states surface
    // as messages inside the popover instead of a dead button. Refresh
    // file tree on open so a freshly-generated page lands quickly.
    const handleToggle = () => {
        if (!open) refresh()
        setOpen((v) => !v)
    }

    const reason = !devUrl
        ? 'Dev server not running — start it from the Preview toolbar.'
        : pages.length === 0
          ? 'No pages found yet. Ask the chat to generate one.'
          : null

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={handleToggle}
                className={cn(
                    'flex h-8 items-center gap-1 rounded-md border bg-card px-2 text-[10.5px] transition-colors hover:bg-accent'
                )}
                title={
                    reason ??
                    `${pages.length} page${pages.length === 1 ? '' : 's'} — click to switch`
                }
            >
                Pages
                <span
                    className={cn(
                        'rounded px-1 text-[9px] font-semibold',
                        pages.length > 0
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground'
                    )}
                >
                    {pages.length}
                </span>
                <ChevronDown size={10} />
            </button>
            {open && (
                <div className="absolute right-0 top-9 z-30 max-h-72 w-52 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
                    {reason ? (
                        <p className="px-2 py-1.5 text-[10.5px] italic text-muted-foreground">
                            {reason}
                        </p>
                    ) : (
                        pages.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => navigate(name)}
                                disabled={!devUrl}
                                className={cn(
                                    'flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px]',
                                    devUrl ? 'hover:bg-accent' : 'cursor-not-allowed opacity-50'
                                )}
                            >
                                <span className="font-mono">{name}</span>
                                <ExternalLink size={10} className="text-muted-foreground/60" />
                            </button>
                        ))
                    )}
                    <div className="mt-1 border-t pt-1">
                        <button
                            type="button"
                            onClick={refresh}
                            className="flex w-full items-center justify-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <RefreshCw size={9} />
                            Refresh
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
