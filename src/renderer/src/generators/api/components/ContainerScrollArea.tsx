import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { cn } from '@renderer/lib/utils';
import React from 'react';

interface ContainerScrollAreaProps {
    children: React.ReactNode;
    size?: 'sm' | 'lg';
    className?: string;
}

export const ContainerScrollArea: React.FC<ContainerScrollAreaProps> = ({
    children,
    className,
}) => {
    return (
        <ScrollArea
            className={cn(
                'h-[calc(100svh-var(--header-height-three))]',
                className
            )}
        >
            {children}
        </ScrollArea>
    );
};
