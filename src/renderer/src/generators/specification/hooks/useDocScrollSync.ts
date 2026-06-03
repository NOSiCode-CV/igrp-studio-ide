import type { editor } from 'monaco-editor'
import { useEffect, type RefObject } from 'react'

/**
 * One-way scroll sync: when the user scrolls the markdown preview, reveal
 * the matching source line in the Monaco editor. Editor → Preview is NOT
 * synced (intentional — keeps the implementation simple and avoids
 * feedback-loop guards).
 *
 * Mapping is done via `data-source-line` attributes injected by
 * `DocPreview` from the remark AST. The topmost block currently visible
 * inside the preview's scroll viewport defines the line we centre.
 *
 * Throttled with `requestAnimationFrame` so fast scrolls don't queue
 * dozens of `revealLine` calls.
 */
export function usePreviewToEditorScrollSync(
    previewRef: RefObject<HTMLDivElement | null>,
    editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
    enabled: boolean
): void {
    useEffect(() => {
        if (!enabled) return
        const previewEl = previewRef.current
        if (!previewEl) return

        let frame = 0

        const handleScroll = () => {
            if (frame) return
            frame = requestAnimationFrame(() => {
                frame = 0
                const editorInstance = editorRef.current
                if (!editorInstance) return

                const viewportTop = previewEl.getBoundingClientRect().top
                // Look at all elements with data-source-line in document order
                // and pick the first whose top is at-or-below the viewport top.
                // (Document order matches markdown source order since react-
                // markdown renders depth-first.)
                const blocks = previewEl.querySelectorAll<HTMLElement>('[data-source-line]')
                let chosenLine: number | null = null
                for (const el of blocks) {
                    const rect = el.getBoundingClientRect()
                    if (rect.bottom < viewportTop) continue
                    const raw = el.getAttribute('data-source-line')
                    const parsed = raw ? Number(raw) : NaN
                    if (Number.isFinite(parsed)) chosenLine = parsed
                    break
                }
                if (chosenLine !== null) {
                    editorInstance.revealLineInCenter(chosenLine)
                }
            })
        }

        previewEl.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            if (frame) cancelAnimationFrame(frame)
            previewEl.removeEventListener('scroll', handleScroll)
        }
        // We intentionally re-register the listener when refs/enabled change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, previewRef.current, editorRef.current])
}
