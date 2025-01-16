import { ScrollArea } from '@renderer/components/ui/scroll-area';
import React from 'react';

interface ContainerScrollAreaProps {
    children: React.ReactNode;
    size?: 'sm' | 'lg';
}

export const ContainerScrollArea: React.FC<ContainerScrollAreaProps> = ({
    children
}) => {
    return <ScrollArea className="h-100 mb-10">{children}</ScrollArea>;
};
