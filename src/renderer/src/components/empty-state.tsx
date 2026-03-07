import { cn } from '@renderer/lib/utils'
import { FolderOpen } from 'lucide-react'

interface EmptyStateProps {
    message: string
    className?: string
}

export function EmptyState({ message, className }: EmptyStateProps) {
    return (
        <div
            className={cn('flex flex-col items-center justify-center h-64 text-center', className)}
        >
            <FolderOpen className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{message}</p>
        </div>
    )
}
