import { cn } from '@renderer/lib/utils'
import { UploadCloud } from 'lucide-react'
import { type JSX, type ReactNode, useCallback, useState } from 'react'

interface DropZoneProps {
    onFileDropped: (filePath: string) => void
    disabled?: boolean
    className?: string
    children?: ReactNode
}

const DropZone = ({
    onFileDropped,
    disabled = false,
    className,
    children
}: DropZoneProps): JSX.Element => {
    const [isOver, setIsOver] = useState(false)

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (disabled) return
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = 'copy'
            setIsOver(true)
        },
        [disabled]
    )

    const handleDragLeave = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (disabled) return
            e.preventDefault()
            e.stopPropagation()
            setIsOver(false)
        },
        [disabled]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (disabled) return
            e.preventDefault()
            e.stopPropagation()
            setIsOver(false)

            const files = e.dataTransfer?.files
            if (!files || files.length === 0) return

            const file = files[0]
            const filePath = window.markitdown.getFilePath(file)
            if (filePath) {
                onFileDropped(filePath)
            }
        },
        [disabled, onFileDropped]
    )

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                'relative',
                isOver &&
                    'after:absolute after:inset-0 after:pointer-events-none after:rounded-md after:border-2 after:border-dashed after:border-primary after:bg-primary/5',
                className
            )}
        >
            {children}
            {isOver && !children && (
                <div className="flex flex-col items-center justify-center gap-2 h-full text-primary">
                    <UploadCloud className="h-10 w-10" />
                    <span className="text-sm">Drop file to convert</span>
                </div>
            )}
        </div>
    )
}

export default DropZone
