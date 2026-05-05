import { useEffect, useRef } from 'react'

/**
 * Calls `save(value)` after `delayMs` of the value being stable. Cancels
 * the pending timer on unmount or when the value changes again.
 *
 * `save` is referenced by ref so callers don't need to memoise it.
 */
export function useDebouncedAutoSave<T>(
    value: T,
    save: (value: T) => void | Promise<void>,
    delayMs = 500
): void {
    const saveRef = useRef(save)
    saveRef.current = save

    useEffect(() => {
        const timer = setTimeout(() => {
            void saveRef.current(value)
        }, delayMs)
        return () => clearTimeout(timer)
    }, [value, delayMs])
}
