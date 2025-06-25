import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { PageCardProps } from './page-card-view';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import {
    Component,
    Edit,
    FileText,
    Folder,
    FolderOpen,
    MoreHorizontal,
    Trash,
    Copy,
} from 'lucide-react';
import { PageDefinition } from './page-manager';

export const PageActionMenu = ({
    page,
    onDelete,
    onEdit,
    onAddComponents,
    openDialogNewPage,
    onDuplicate,
}: PageCardProps) => {
    const { t } = useTranslation();
    const { isPage } = page;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                >
                    <MoreHorizontal className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}><Edit/>{t('edit')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(page)}>
                    <Copy />
                    {t('duplicate')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddComponents(page)}>
                    <Component />
                    {t('addComponents')}
                </DropdownMenuItem>
                {isPage && (
                    <DropdownMenuItem
                        onSelect={() => openDialogNewPage?.(page)}
                    >
                        <Component />
                        {t('Create SubPage')}
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(page)}
                >
                    <Trash />
                    <span>{t('delete')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const PageTypeIcon = ({
    page,
    compCount,
    isOpen,
}: {
    page: PageDefinition;
    compCount: number;
    isOpen: boolean;
}) => {
    return page.type === 'page' ? (
        compCount > 0 ? (
            isOpen ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
                <Folder className="h-4 w-4 text-blue-500" />
            )
        ) : (
            <FileText className="h-4 w-4 text-green-500" />
        )
    ) : (
        <Component className="h-4 w-4 text-purple-500" />
    );
};
