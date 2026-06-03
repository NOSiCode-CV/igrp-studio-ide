import { useCallback, useEffect, useRef, useState } from 'react'
import { useSaveProcessDiagram } from './useSaveProcessDiagram'

export interface UseAutoSaveDiagramOptions {
    /** Debounce window before a save is fired. Defaults to 1500 ms (plan §M6.2). */
    delayMs?: number
}

export interface AutoSaveDiagramApi {
    /** Replace the pending value and reset the debounce timer. */
    scheduleSave: (xml: string) => void
    /** Fire any pending save now (used on blur / explicit save). */
    flush: () => Promise<void>
    /** Drop any pending save without firing it. */
    cancel: () => void
    isSaving: boolean
    isDirty: boolean
    lastSavedAt: number | null
    error: Error | null
}

export function useAutoSaveDiagram(
    processId: string | undefined,
    options: UseAutoSaveDiagramOptions = {}
): AutoSaveDiagramApi {
    const delayMs = options.delayMs ?? 1500
    const mutation = useSaveProcessDiagram(processId)

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingRef = useRef<string | null>(null)
    const inFlightRef = useRef<boolean>(false)
    const lastSavedRef = useRef<string | null>(null)

    const [isDirty, setIsDirty] = useState<boolean>(false)
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

    const clearTimer = useCallback((): void => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const triggerSave = useCallback(async (): Promise<void> => {
        clearTimer()
        const xml = pendingRef.current
        if (xml == null) return
        if (inFlightRef.current) return // already saving — chained in onSettled below
        if (xml === lastSavedRef.current) {
            setIsDirty(false)
            return
        }
        pendingRef.current = null
        inFlightRef.current = true
        try {
            await mutation.mutateAsync({ xml })
            lastSavedRef.current = xml
            setLastSavedAt(Date.now())
        } catch {
            // toast surfaced by useSaveProcessDiagram
        }
        inFlightRef.current = false
        // If new changes arrived during the in-flight save, fire another pass.
        if (pendingRef.current != null && pendingRef.current !== lastSavedRef.current) {
            void triggerSave()
        } else {
            setIsDirty(false)
        }
    }, [clearTimer, mutation])

    const scheduleSave = useCallback(
        (xml: string): void => {
            pendingRef.current = xml
            setIsDirty(xml !== lastSavedRef.current)
            clearTimer()
            timerRef.current = setTimeout(() => {
                void triggerSave()
            }, delayMs)
        },
        [clearTimer, delayMs, triggerSave]
    )

    const flush = useCallback((): Promise<void> => triggerSave(), [triggerSave])

    const cancel = useCallback((): void => {
        clearTimer()
        pendingRef.current = null
        setIsDirty(false)
    }, [clearTimer])

    // Keep the latest triggerSave reachable from the unmount cleanup without
    // re-running the effect every render (which would otherwise misfire the
    // cleanup whenever the mutation reference changes).
    const triggerSaveRef = useRef(triggerSave)
    useEffect(() => {
        triggerSaveRef.current = triggerSave
    }, [triggerSave])

    // Best-effort flush on unmount: fire any pending save without awaiting.
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
            }
            if (pendingRef.current != null && pendingRef.current !== lastSavedRef.current) {
                void triggerSaveRef.current()
            }
        }
    }, [])

    return {
        scheduleSave,
        flush,
        cancel,
        isSaving: mutation.isPending || inFlightRef.current,
        isDirty,
        lastSavedAt,
        error: mutation.error
    }
}
