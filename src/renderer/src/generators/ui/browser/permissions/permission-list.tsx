import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@renderer/components/ui/table'
import {
    PermissionActionMenu,
    PermissionTypeIcon
} from '@renderer/generators/ui/browser/components/permission-actions'
import type { PermissionCatalogEntry } from '@renderer/generators/ui/permission-catalog/types'
import { formatFileDate } from '@renderer/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface PermissionListProps {
    entries: PermissionCatalogEntry[]
    onEdit: (entry: PermissionCatalogEntry) => void
    onDelete: (entry: PermissionCatalogEntry) => void
    onCopyKey: (key: string) => void
}

export function PermissionList({
    entries,
    onEdit,
    onDelete,
    onCopyKey
}: PermissionListProps): React.JSX.Element {
    const { t } = useTranslation()
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const toggleRow = (id: string): void => {
        setExpandedRows((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <div className="min-w-0 max-w-full rounded-xl border border-border dark:border-slate-800/80">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12" />
                        <TableHead>{t('permissionLabel', 'Label')}</TableHead>
                        <TableHead>{t('permissionKey', 'Key')}</TableHead>
                        <TableHead>{t('permissionUsage', 'Usage')}</TableHead>
                        <TableHead>{t('sortLastModified', 'Last modified')}</TableHead>
                        <TableHead>{t('actions', 'Actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => {
                        const hasSources = (entry.sources?.length ?? 0) > 0
                        const expanded = expandedRows.has(entry.id)
                        const updatedAt = entry.updatedAt ? Date.parse(entry.updatedAt) : NaN

                        return (
                            <React.Fragment key={entry.id}>
                                <TableRow className="group dark:hover:bg-slate-900/40">
                                    <TableCell>
                                        {hasSources && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRow(entry.id)}
                                                className="h-6 w-6 p-0"
                                            >
                                                {expanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <PermissionTypeIcon entry={entry} isOpen={expanded} />
                                            <span>{entry.label}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-emerald-400/90">
                                            {entry.key}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={entry.usageCount > 0 ? 'default' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {entry.usageCount}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {!Number.isNaN(updatedAt) ? (
                                            formatFileDate(updatedAt)
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <PermissionActionMenu
                                            entry={entry}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onCopyKey={onCopyKey}
                                        />
                                    </TableCell>
                                </TableRow>
                                {expanded && hasSources && (
                                    <TableRow>
                                        <TableCell />
                                        <TableCell colSpan={5}>
                                            <div className="space-y-1 py-1">
                                                {entry.description && (
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        {entry.description}
                                                    </p>
                                                )}
                                                {entry.sources!.map((source) => (
                                                    <div
                                                        key={source}
                                                        className="text-xs text-muted-foreground pl-2 border-l-2 border-purple-200"
                                                    >
                                                        {source}
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
