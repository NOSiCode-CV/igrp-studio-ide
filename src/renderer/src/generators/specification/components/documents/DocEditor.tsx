import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import { cn } from '@renderer/lib/utils'
import { type DragEvent, type JSX, useEffect, useRef, useState } from 'react'

interface DocEditorProps {
    value: string
    onChange: (value: string) => void
    /** Called when the user drops a file on the editor. */
    onDropFile?: (filePath: string) => void
    /**
     * Forward the Monaco editor instance once mounted. Used by the parent
     * to drive imperative APIs (reveal line, set selection, scroll-sync).
     */
    onMount?: OnMount
    className?: string
    placeholder?: string
}

export function DocEditor({
    value,
    onChange,
    onDropFile,
    onMount,
    className,
    placeholder = 'Start writing specification…'
}: DocEditorProps): JSX.Element {
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Reset drag state when value changes externally (e.g. selecting a doc).
        setIsDragging(false)
    }, [value])

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        if (!onDropFile) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
        if (!isDragging) setIsDragging(true)
    }

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        const next = event.relatedTarget as Node | null
        if (next && containerRef.current?.contains(next)) return
        setIsDragging(false)
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        if (!onDropFile) return
        event.preventDefault()
        setIsDragging(false)
        for (const file of Array.from(event.dataTransfer.files)) {
            const path = window.specDoc.getFilePath(file)
            if (path) onDropFile(path)
        }
    }

    return (
        <div
            ref={containerRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn('relative h-full', className)}
        >
            <MonacoEditor
                height="100%"
                language="markdown"
                value={value}
                onChange={(next) => onChange(next ?? '')}
                onMount={onMount}
                theme="vs-dark"
                options={{
                    fontSize: 13,
                    fontFamily:
                        'JetBrains Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    lineNumbers: 'off',
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    wrappingIndent: 'same',
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'none',
                    folding: false,
                    glyphMargin: false,
                    padding: { top: 24, bottom: 24 },
                    placeholder
                }}
            />
            {isDragging && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-primary/5 backdrop-blur-[1px]">
                    <div className="rounded-lg border-2 border-dashed border-primary bg-background/80 px-6 py-4 text-sm font-medium">
                        Drop to convert and insert
                    </div>
                </div>
            )}
        </div>
    )
}
