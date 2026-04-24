import { useCallback, useState } from 'react'
import { humanizeMarkItDownError } from '../utils/file-errors'

interface ConverterState {
    markdown: string
    fileName: string | null
    filePath: string | null
    error: string | null
    isConverting: boolean
    durationMs: number | null
}

const initialState: ConverterState = {
    markdown: '',
    fileName: null,
    filePath: null,
    error: null,
    isConverting: false,
    durationMs: null
}

export function useMarkdownConverter(): {
    state: ConverterState
    convert: (filePath: string) => Promise<void>
    loadFromHistory: (fileName: string, filePath: string, markdown: string) => void
    clear: () => void
} {
    const [state, setState] = useState<ConverterState>(initialState)

    const convert = useCallback(async (filePath: string): Promise<void> => {
        const fileName = filePath.split(/[\\/]/).pop() ?? filePath
        setState({
            markdown: '',
            fileName,
            filePath,
            error: null,
            isConverting: true,
            durationMs: null
        })

        try {
            const result = await window.markitdown.convert(filePath)
            if (result.ok) {
                setState({
                    markdown: result.markdown,
                    fileName,
                    filePath,
                    error: null,
                    isConverting: false,
                    durationMs: result.durationMs
                })
            } else {
                setState({
                    markdown: '',
                    fileName,
                    filePath,
                    error: humanizeMarkItDownError(result.code, result.error),
                    isConverting: false,
                    durationMs: null
                })
            }
        } catch (err) {
            setState({
                markdown: '',
                fileName,
                filePath,
                error: err instanceof Error ? err.message : 'Conversion failed',
                isConverting: false,
                durationMs: null
            })
        }
    }, [])

    const loadFromHistory = useCallback(
        (fileName: string, filePath: string, markdown: string): void => {
            setState({
                markdown,
                fileName,
                filePath,
                error: null,
                isConverting: false,
                durationMs: null
            })
        },
        []
    )

    const clear = useCallback((): void => {
        setState(initialState)
    }, [])

    return { state, convert, loadFromHistory, clear }
}
