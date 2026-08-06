import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'
import { EmptyList } from '@renderer/components/empty-list'
import { CreatePermissionDialog } from '@renderer/generators/ui/permission-catalog/create-permission-dialog'
import { usePermissionCatalog } from '@renderer/generators/ui/permission-catalog/PermissionCatalogContext'
import type { PermissionCatalogEntry } from '@renderer/generators/ui/permission-catalog/types'
import type { PermissionKeySuggestionContext } from '@renderer/generators/ui/permission-catalog/suggestPermissionKey'
import useToast from '@renderer/hooks/useToast'
import useStudio from '@renderer/hooks/use-studio'
import { cn } from '@renderer/lib/utils'
import { KeyRound, LayoutGrid, Plus, Search, TableIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PermissionCardView } from './permission-card-view'
import { PermissionList } from './permission-list'

export type PermissionViewMode = 'card' | 'table'
export type PermissionStatusFilter = 'ALL' | 'IN_USE' | 'UNUSED'

export function PermissionManager(): React.JSX.Element {
    const { t } = useTranslation()
    const { showSuccessToast, showErrorToast } = useToast()
    const { config } = useStudio()
    const { catalog, addPermission, updatePermission, deletePermission, loading, refresh } =
        usePermissionCatalog()

    useEffect(() => {
        void refresh()
    }, [refresh])

    const suggestionContext = useMemo<PermissionKeySuggestionContext>(
        () => ({ projectName: config?.name }),
        [config?.name]
    )

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<PermissionStatusFilter>('ALL')
    const [viewMode, setViewMode] = useState<PermissionViewMode>('card')
    const [createOpen, setCreateOpen] = useState(false)
    const [editing, setEditing] = useState<PermissionCatalogEntry | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<PermissionCatalogEntry | null>(null)

    const usedCount = useMemo(() => catalog.filter((e) => e.usageCount > 0).length, [catalog])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        let list = catalog

        if (statusFilter === 'IN_USE') list = list.filter((e) => e.usageCount > 0)
        if (statusFilter === 'UNUSED') list = list.filter((e) => e.usageCount === 0)

        if (q) {
            list = list.filter(
                (e) =>
                    e.key.toLowerCase().includes(q) ||
                    e.label.toLowerCase().includes(q) ||
                    (e.description?.toLowerCase().includes(q) ?? false) ||
                    (e.sources?.some((s) => s.toLowerCase().includes(q)) ?? false)
            )
        }

        return [...list].sort((a, b) => a.key.localeCompare(b.key))
    }, [catalog, search, statusFilter])

    const handleCopyKey = useCallback(
        async (key: string) => {
            try {
                await navigator.clipboard.writeText(key)
                showSuccessToast(t('permissionKeyCopied', 'Permission key copied'))
            } catch {
                showSuccessToast(key)
            }
        },
        [showSuccessToast, t]
    )

    const confirmDelete = (): void => {
        if (!deleteTarget) return
        const target = deleteTarget
        const removeFromRules = target.usageCount > 0
        setDeleteTarget(null)
        void deletePermission(target.id, { removeFromRules })
            .then(() =>
                showSuccessToast(
                    removeFromRules
                        ? t(
                              'permissionDeletedAndCleaned',
                              'Permission deleted and removed from rules'
                          )
                        : t('permissionDeleted', 'Permission deleted')
                )
            )
            .catch((err) => showErrorToast(err instanceof Error ? err.message : String(err)))
    }

    const emptyState =
        catalog.length === 0 ? (
            <EmptyList
                title={t('permissionsEmptyTitle', 'No permissions yet')}
                description={t(
                    'permissionsEmptyDesc',
                    'Create permission keys here, then reuse them when adding rules on pages and components.'
                )}
                actionLabel={t('permissionAddKey', 'Add Key')}
                onAction={() => setCreateOpen(true)}
            />
        ) : (
            <EmptyList
                title={t('noPermissionsFound', 'No permissions match your search.')}
                description={t(
                    'permissionsSearchHint',
                    'Try a different key, label, or description.'
                )}
            />
        )

    return (
        <div className="space-y-5">
            <div className="flex justify-between gap-4 border-b border-border pb-4">
                <div className="min-w-0 shrink-0">
                    <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                        <KeyRound className="h-5 w-5 text-primary" />
                        {t('permissionLists', 'Permission catalog')}
                    </h2>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {catalog.length}{' '}
                        {catalog.length === 1
                            ? t('permissionSingular', 'permission')
                            : t('permissionPlural', 'permissions')}{' '}
                        • {usedCount} {t('permissionInUse', 'in use')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5">
                    <div className="relative min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('searchPermissions', 'Search catalog…')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value as PermissionStatusFilter)
                        }
                        className="cursor-pointer rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-ring focus:outline-none"
                    >
                        <option value="ALL">{t('permissionStatusAll', 'All status')}</option>
                        <option value="IN_USE">{t('permissionFilterUsed', 'In use')}</option>
                        <option value="UNUSED">{t('permissionFilterUnused', 'Unused')}</option>
                    </select>

                    <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                        <button
                            type="button"
                            title={t('cardView', 'Card view')}
                            onClick={() => setViewMode('card')}
                            className={cn(
                                'rounded-md p-1.5 transition-all',
                                viewMode === 'card'
                                    ? 'bg-background text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            title={t('tableView', 'Table view')}
                            onClick={() => setViewMode('table')}
                            className={cn(
                                'rounded-md p-1.5 transition-all',
                                viewMode === 'table'
                                    ? 'bg-background text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <TableIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:scale-95"
                    >
                        <Plus className="h-4 w-4 stroke-[2.5]" />
                        {t('permissionAddKey', 'Add Key')}
                    </button>
                </div>
            </div>

            {loading && catalog.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                    {t('loading', 'Loading…')}
                </p>
            ) : filtered.length === 0 ? (
                emptyState
            ) : viewMode === 'card' ? (
                <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                    {filtered.map((entry) => (
                        <PermissionCardView
                            key={entry.id}
                            entry={entry}
                            onEdit={setEditing}
                            onDelete={setDeleteTarget}
                            onCopyKey={handleCopyKey}
                        />
                    ))}
                </div>
            ) : (
                <PermissionList
                    entries={filtered}
                    onEdit={setEditing}
                    onDelete={setDeleteTarget}
                    onCopyKey={handleCopyKey}
                />
            )}

            <CreatePermissionDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                suggestionContext={suggestionContext}
                onCreated={async (input) => {
                    await addPermission(input)
                    showSuccessToast(t('savedSuccessfully', { name: input.key }))
                }}
            />

            <CreatePermissionDialog
                open={!!editing}
                onOpenChange={(open) => !open && setEditing(null)}
                title={t('editPermission', 'Edit permission')}
                initialKey={editing?.key ?? ''}
                initialLabel={editing?.label ?? ''}
                initialDescription={editing?.description ?? ''}
                onCreated={async (input) => {
                    if (editing) {
                        await updatePermission(editing.id, {
                            key: input.key,
                            label: input.label,
                            description: input.description
                        })
                        showSuccessToast(t('savedSuccessfully', { name: input.key }))
                    }
                    setEditing(null)
                }}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('areYouAbsolutelySure')}</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    {t('confirmRemoveRecord')}{' '}
                                    <code className="font-mono text-foreground">
                                        {deleteTarget?.key}
                                    </code>
                                    ?
                                </p>
                                {deleteTarget && deleteTarget.usageCount > 0 && (
                                    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200">
                                        <p className="font-medium text-amber-100">
                                            {t(
                                                'permissionDeleteInUseWarning',
                                                'Used in {{count}} rule(s). Confirming will remove this key from those rules, then delete it from the catalog.',
                                                { count: deleteTarget.usageCount }
                                            )}
                                        </p>
                                        {(deleteTarget.sources?.length ?? 0) > 0 && (
                                            <ul className="mt-2 list-disc space-y-0.5 pl-4 font-mono text-xs">
                                                {deleteTarget.sources!.slice(0, 8).map((source) => (
                                                    <li key={source}>{source}</li>
                                                ))}
                                                {deleteTarget.sources!.length > 8 && (
                                                    <li>
                                                        +{deleteTarget.sources!.length - 8} more
                                                    </li>
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                            {deleteTarget && deleteTarget.usageCount > 0
                                ? t('deleteAndCleanRules', 'Delete & clean rules')
                                : t('continue')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
