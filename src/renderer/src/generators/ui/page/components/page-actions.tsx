import {
    IGRPButtonPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { PageCardProps } from '@renderer/generators/ui/page/page-card-view'
import type { PageDefinition } from '@renderer/generators/ui/page/page-manager'
import {
    Component,
    Copy,
    Edit,
    FileText,
    Folder,
    FolderOpen,
    MoreHorizontal,
    Trash
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const PageActionMenu = ({
    page,
    onDelete,
    onEdit,
    onAddComponents,
    openDialogNewPage,
    onDuplicate,
    setIsSubPage
}: PageCardProps) => {
    const { t } = useTranslation()
    const { isPage } = page
    return (
        <IGRPDropdownMenuPrimitive>
            <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                >
                    <MoreHorizontal className="h-3 w-3" />
                </IGRPButtonPrimitive>
            </IGRPDropdownMenuTriggerPrimitive>
            <IGRPDropdownMenuContentPrimitive align="end">
                <IGRPDropdownMenuItemPrimitive onClick={onEdit}>
                    <Edit />
                    {t('edit')}
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive onClick={() => onDuplicate?.(page)}>
                    <Copy />
                    {t('duplicate')}
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive onClick={() => onAddComponents(page)}>
                    <Component />
                    {t('addComponents')}
                </IGRPDropdownMenuItemPrimitive>
                {isPage && (
                    <IGRPDropdownMenuItemPrimitive
                        onSelect={() => {
                            openDialogNewPage?.(page)
                            setIsSubPage(true)
                        }}
                    >
                        <Component />
                        {t('Create SubPage')}
                    </IGRPDropdownMenuItemPrimitive>
                )}
                <IGRPDropdownMenuItemPrimitive
                    className="text-destructive"
                    onClick={() => onDelete(page)}
                >
                    <Trash />
                    <span>{t('delete')}</span>
                </IGRPDropdownMenuItemPrimitive>
            </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
    )
}

export const PageTypeIcon = ({
    page,
    compCount,
    isOpen
}: {
    page: PageDefinition
    compCount: number
    isOpen: boolean
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
    )
}
