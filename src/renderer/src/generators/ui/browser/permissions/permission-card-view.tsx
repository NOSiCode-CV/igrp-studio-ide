import {
    PermissionActionMenu
} from '@renderer/generators/ui/browser/components/permission-actions'
import { browserCardClassName } from '@renderer/generators/ui/browser/browser-card-styles'
import type { PermissionCatalogEntry } from '@renderer/generators/ui/permission-catalog/types'
import { cn } from '@renderer/lib/utils'
import { formatFileDate } from '@renderer/utils'
import { ChevronRight, Key } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PermissionCardViewProps {
    entry: PermissionCatalogEntry
    onEdit: (entry: PermissionCatalogEntry) => void
    onDelete: (entry: PermissionCatalogEntry) => void
    onCopyKey: (key: string) => void
}

export function PermissionCardView({
    entry,
    onEdit,
    onDelete,
    onCopyKey
}: PermissionCardViewProps): React.JSX.Element {
    const { t } = useTranslation()
    const inUse = entry.usageCount > 0
    const updatedAt = entry.updatedAt ? Date.parse(entry.updatedAt) : NaN

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onEdit(entry)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onEdit(entry)
                }
            }}
            className={cn(
                'group relative flex min-h-[132px] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border p-4',
                browserCardClassName()
            )}
        >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/0 transition-all duration-300 group-hover:bg-primary/80" />

            <div>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                        <div className="flex min-w-0 items-center gap-1.5">
                            <Key className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                                {entry.label}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="mt-1.5 pl-6">
                    <p className="truncate font-mono text-xs font-medium tracking-tight text-muted-foreground">
                        {entry.key}
                    </p>
                    {!Number.isNaN(updatedAt) && (
                        <p className="mt-1 font-sans text-[11px] text-muted-foreground">
                            {formatFileDate(updatedAt)}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pl-6 pt-3">
                {entry.usageCount > 0 ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(entry)
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
                    >
                        {entry.usageCount}{' '}
                        {entry.usageCount === 1
                            ? t('permissionRuleSingular', 'rule')
                            : t('permissionRulePlural', 'rules')}
                    </button>
                ) : (
                    <span className="font-mono text-[11px] italic text-muted-foreground">
                        {t('permissionNoRules', 'sem regras')}
                    </span>
                )}

                <div className="flex items-center gap-1.5">
                    {inUse && (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                            {t('permissionInUseBadge', 'Em uso')} ({entry.usageCount})
                        </span>
                    )}
                    <div
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <PermissionActionMenu
                            entry={entry}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onCopyKey={onCopyKey}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
