import { ScrollArea } from '@renderer/components/ui/scroll-area';
import React from 'react';

interface ContainerScrollAreaProps {
    children: React.ReactNode;
    size?: 'sm' | 'lg';
}

export const ContainerScrollArea: React.FC<ContainerScrollAreaProps> = ({
    children
}) => {
    return <ScrollArea className='h-[calc(100svh-var(--header-height-two))]'>{children}</ScrollArea>;
};
