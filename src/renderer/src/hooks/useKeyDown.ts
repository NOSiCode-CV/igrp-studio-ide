import type { KeyboardKey } from '@renderer/constants/shortcut'
import { useEffect } from 'react'

export const useKeyPress = (callback: (T?: any) => void, keys: KeyboardKey[]): void => {
    const onKeyDown = (event: KeyboardEvent) => {
        const wasAnyKeyPressed = keys.some((key) => event.key === key)

        if ((event.ctrlKey || event.metaKey) && wasAnyKeyPressed) {
            event.preventDefault()
            callback()
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown)

        return () => {
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [onKeyDown])
}
