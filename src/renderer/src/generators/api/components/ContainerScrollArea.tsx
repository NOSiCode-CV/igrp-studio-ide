import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { cn } from '@renderer/lib/utils'
import type React from 'react'

interface ContainerScrollAreaProps {
    children: React.ReactNode
    size?: 'sm' | 'lg'
    className?: string
    /** Allow content to grow horizontally so the ScrollArea scrolls on the X axis. */
    growX?: boolean
}

export const ContainerScrollArea: React.FC<ContainerScrollAreaProps> = ({
    children,
    className,
    growX
}) => {
    return (
        <ScrollArea
            growX={growX}
            className={cn('h-[calc(100svh-var(--header-height-three))]', className)}
        >
            {children}
        </ScrollArea>
    )
}
