import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import { EmptyList } from '@renderer/components/empty-list'
import { CreatePermissionDialog } from '@renderer/generators/ui/permission-catalog/create-permission-dialog'
import { usePermissionCatalog } from '@renderer/generators/ui/permission-catalog/PermissionCatalogContext'
import type { PermissionCatalogEntry } from '@renderer/generators/ui/permission-catalog/types'
import type { PermissionKeySuggestionContext } from '@renderer/generators/ui/permission-catalog/suggestPermissionKey'
import useToast from '@renderer/hooks/useToast'
import useStudio from '@renderer/hooks/use-studio'
import { cn } from '@renderer/lib/utils'
import { KeyRound, LayoutGrid, Plus, Search, TableIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PermissionCardView } from './permission-card-view'
import { PermissionList } from './permission-list'

export type PermissionViewMode = 'card' | 'table'
export type PermissionStatusFilter = 'ALL' | 'IN_USE' | 'UNUSED'

export function PermissionManager(): React.JSX.Element {
    const { t } = useTranslation()
    const { showSuccessToast } = useToast()
    const { config } = useStudio()
    const { catalog, addPermission, updatePermission, deletePermission } = usePermissionCatalog()

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
        if (deleteTarget) deletePermission(deleteTarget.id)
        setDeleteTarget(null)
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
            <div className="flex justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="min-w-0 shrink-0">
                    <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                        <KeyRound className="h-5 w-5 text-emerald-400" />
                        {t('permissionLists', 'Permission catalog')}
                    </h2>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">
                        {catalog.length}{' '}
                        {catalog.length === 1
                            ? t('permissionSingular', 'permission')
                            : t('permissionPlural', 'permissions')}{' '}
                        • {usedCount} {t('permissionInUse', 'in use')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5">
                    <div className="relative min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder={t('searchPermissions', 'Search catalog…')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value as PermissionStatusFilter)
                        }
                        className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
                    >
                        <option value="ALL">{t('permissionStatusAll', 'All status')}</option>
                        <option value="IN_USE">{t('permissionFilterUsed', 'In use')}</option>
                        <option value="UNUSED">{t('permissionFilterUnused', 'Unused')}</option>
                    </select>

                    <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
                        <button
                            type="button"
                            title={t('cardView', 'Card view')}
                            onClick={() => setViewMode('card')}
                            className={cn(
                                'rounded-md p-1.5 transition-all',
                                viewMode === 'card'
                                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
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
                                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            )}
                        >
                            <TableIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/10 transition-colors hover:bg-emerald-600 active:scale-95"
                    >
                        <Plus className="h-4 w-4 stroke-[2.5]" />
                        {t('permissionAddKey', 'Add Key')}
                    </button>
                </div>
            </div>

            {filtered.length === 0 ? (
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
                onCreated={(input) => addPermission(input)}
            />

            <CreatePermissionDialog
                open={!!editing}
                onOpenChange={(open) => !open && setEditing(null)}
                title={t('editPermission', 'Edit permission')}
                initialKey={editing?.key ?? ''}
                initialLabel={editing?.label ?? ''}
                initialDescription={editing?.description ?? ''}
                onCreated={(input) => {
                    if (editing) {
                        updatePermission(editing.id, {
                            key: input.key,
                            label: input.label,
                            description: input.description
                        })
                    }
                    setEditing(null)
                }}
            />

            <AlertDialogDelete
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                hasTrigger={false}
                recordId={deleteTarget?.key}
            />
        </div>
    )
}
