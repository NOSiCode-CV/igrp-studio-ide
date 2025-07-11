import { cn } from '@renderer/lib/utils';

interface GenNoInfoCompProps {
    type?: string;
    isActive?: boolean;
}
export const GenNoInfoComp = ({
    type = 'COMPONENTS',
    isActive = false,
}: GenNoInfoCompProps) => {
    return (
        <div
            className={cn(
                'text-xs space-x-1 min-h-12 flex flex-1 items-center justify-center text-center hover:bg-primary/35 rounded-lg',
                isActive && 'bg-primary/25'
            )}
        >
            <span>DROP</span>
            <span className="text-primary">
                <b>HERE</b>
            </span>
            <span className="truncate">{type}</span>
        </div>
    );
};
