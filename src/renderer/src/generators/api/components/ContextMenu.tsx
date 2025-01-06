import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
} from '@renderer/components/ui/context-menu';

interface ContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContextMenuTabApi: React.FC<ContextMenuProps> = (
    isOpen,
    onClose
) => {
    return (
        <ContextMenu  onOpenChange={onClose}>
            <ContextMenuContent className="w-64">
                <ContextMenuItem>Profile</ContextMenuItem>
                <ContextMenuItem>Billing</ContextMenuItem>
                <ContextMenuItem>Team</ContextMenuItem>
                <ContextMenuItem>Subscription</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
