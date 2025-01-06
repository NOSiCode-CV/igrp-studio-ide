import { ScrollArea } from '@renderer/components/ui/scroll-area';
import React from 'react';

interface ContainerScrollAreaProps {
    children: React.ReactNode;
    size?: 'sm' | 'lg';
}

export const ContainerScrollArea: React.FC<ContainerScrollAreaProps> = ({
    children,
    size = 'sm',
}) => {
    const height =
        size === 'lg'
            ? 'calc(100vh - 10rem)' // Adjust height for lg size
            : 'calc(100vh - 5.0rem)'; // Default height for sm size
    return (
        <div className="overflow-y-auto">
            <ScrollArea style={{ height }}>{children}</ScrollArea>
        </div>
    );
};
