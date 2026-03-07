import { IGRPScrollAreaPrimitive } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import type React from 'react'

interface ContainerScrollAreaProps {
    children: React.ReactNode
    size?: 'sm' | 'lg'
    className?: string
}

export const ContainerScrollArea: React.FC<ContainerScrollAreaProps> = ({
    children,
    className
}) => {
    return (
        <IGRPScrollAreaPrimitive
            className={cn('h-[calc(100svh-var(--header-height-three))]', className)}
        >
            {children}
        </IGRPScrollAreaPrimitive>
    )
}
