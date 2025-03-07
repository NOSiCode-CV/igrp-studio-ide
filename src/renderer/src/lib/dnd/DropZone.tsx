import { DropZone as activeDropZoneProps } from '@renderer/lib/dnd/types';
import { DropIndicator } from './drop-indicator';

interface DropZoneProps {
    layoutMode: string;
    activeDropZone: activeDropZoneProps | null;
    componentId: string;
}

export const DropZone = ({ layoutMode, activeDropZone, componentId }: DropZoneProps) => {

    return (
        <>
            <DropIndicator
                position="top"
                isActive={
                    activeDropZone?.id === componentId &&
                    activeDropZone?.position === 'top'
                }
            />
            <DropIndicator
                position="bottom"
                isActive={
                    activeDropZone?.id === componentId &&
                    activeDropZone?.position === 'bottom'
                }
            />
            {layoutMode === 'horizontal' && (
                <>
                    <DropIndicator
                        position="left"
                        isActive={
                            activeDropZone?.id === componentId &&
                            activeDropZone?.position === 'left'
                        }
                    />
                    <DropIndicator
                        position="right"
                        isActive={
                            activeDropZone?.id === componentId &&
                            activeDropZone?.position === 'right'
                        }
                    />
                </>
            )}
        </>
    );
};
