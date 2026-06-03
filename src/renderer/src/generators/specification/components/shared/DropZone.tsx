import { cn } from '@renderer/lib/utils'
import { Plus } from 'lucide-react'
import { type DragEvent, type JSX, type ReactNode, useState } from 'react'

interface DropZoneProps {
    /** Called for each dropped file. Receives the absolute path resolved via webUtils. */
    onFile?: (filePath: string) => void
    /** Called for each dropped URL. */
    onUrl?: (url: string) => void
    /** When true, accepts native files. Default true. */
    acceptsFiles?: boolean
    /** When true, accepts text/uri-list and plain http(s) URLs. Default true. */
    acceptsUrls?: boolean
    className?: string
    children?: ReactNode
    /** Default copy shown when no children are provided. */
    label?: string
}

const URL_REGEX = /^https?:\/\/\S+$/i

export function DropZone({
    onFile,
    onUrl,
    acceptsFiles = true,
    acceptsUrls = true,
    className,
    children,
    label = 'Drag files or URLs here'
}: DropZoneProps): JSX.Element {
    const [isDragging, setIsDragging] = useState(false)

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
        if (!isDragging) setIsDragging(true)
    }

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        // Only clear when leaving the zone (not when entering a child node).
        const next = event.relatedTarget as Node | null
        if (next && event.currentTarget.contains(next)) return
        setIsDragging(false)
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(false)

        if (acceptsFiles && event.dataTransfer.files.length > 0 && onFile) {
            for (const file of Array.from(event.dataTransfer.files)) {
                const path = window.specKB.getFilePath(file)
                if (path) onFile(path)
            }
            return
        }

        if (acceptsUrls && onUrl) {
            const uriList = event.dataTransfer.getData('text/uri-list')
            if (uriList) {
                for (const line of uriList.split(/\r?\n/)) {
                    const trimmed = line.trim()
                    if (trimmed && !trimmed.startsWith('#')) onUrl(trimmed)
                }
                return
            }
            const text = event.dataTransfer.getData('text/plain').trim()
            if (text && URL_REGEX.test(text)) onUrl(text)
        }
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                'rounded-lg border-2 border-dashed transition-colors',
                isDragging
                    ? 'border-primary/70 bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-accent/10',
                className
            )}
        >
            {children ?? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
            )}
        </div>
    )
}
