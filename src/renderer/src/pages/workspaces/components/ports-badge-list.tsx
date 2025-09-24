import { IGRPBadge } from '@igrp/igrp-framework-react-design-system';
import { cn } from '@renderer/lib/utils';

interface PortsBadgeListProps {
    ports?: string[];
    className?: string;
    badgeClassName?: string;
    title?: string;
    emptyMessage?: string;
}

export const PortsBadgeList = ({
    ports = [],
    className = '',
    badgeClassName = '',
    title = 'Ports',
    emptyMessage = 'No ports exposed',
}: PortsBadgeListProps) => {
    if (ports.length === 0) {
        return (
            <div className={cn('p-1 text-xs text-muted-foreground', className)}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={cn('py-1', className)}>
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="text-xs font-mono flex flex-wrap gap-1 mt-0.5">
                {ports.map((port, index) => (
                    <IGRPBadge
                        key={`${port}-${index}`}
                        variant="outline"
                        className={badgeClassName}
                    >
                        {port}
                    </IGRPBadge>
                ))}
            </div>
        </div>
    );
};
