import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import type { PermissionCatalogEntry } from '@renderer/generators/ui/permission-catalog/types'
import { Copy, Edit, Key, MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PermissionActionMenuProps {
    entry: PermissionCatalogEntry
    onEdit: (entry: PermissionCatalogEntry) => void
    onDelete: (entry: PermissionCatalogEntry) => void
    onCopyKey: (key: string) => void
}

export function PermissionActionMenu({
    entry,
    onEdit,
    onDelete,
    onCopyKey
}: PermissionActionMenuProps): React.JSX.Element {
    const { t } = useTranslation()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                    <MoreHorizontal className="h-3 w-3" />
                    <span className="sr-only">{t('actions', 'Actions')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(entry)}>
                    <Edit />
                    {t('edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopyKey(entry.key)}>
                    <Copy />
                    {t('copyPermissionKey', 'Copy key')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(entry)}
                >
                    <Trash2 />
                    <span>
                        {entry.usageCount > 0
                            ? t('deletePermissionInUse', 'Delete (in use)…')
                            : t('delete')}
                    </span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function PermissionTypeIcon({
    entry,
    isOpen
}: {
    entry: PermissionCatalogEntry
    isOpen: boolean
}): React.JSX.Element {
    const inUse = entry.usageCount > 0
    if (inUse) {
        return isOpen ? (
            <Key className="h-4 w-4 text-purple-500" />
        ) : (
            <Key className="h-4 w-4 text-purple-500" />
        )
    }
    return <Key className="h-4 w-4 text-green-500" />
}
