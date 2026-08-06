import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Database, FileBox, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntities } from '../hooks/useEntities'
import { EntityFormModal } from './EntityFormModal'

interface EntityListProps {
    basePath: string | undefined
    selectedId: string | null
    onSelect: (entityId: string) => void
    onImportFromDb?: () => void
}

export function EntityList({
    basePath,
    selectedId,
    onSelect,
    onImportFromDb
}: EntityListProps): React.ReactNode {
    const { t } = useTranslation()
    const { entities, loading } = useEntities(basePath)
    const [filter, setFilter] = useState('')
    const [createOpen, setCreateOpen] = useState(false)

    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase()
        if (!q) return entities
        return entities.filter((e) => e.name.toLowerCase().includes(q))
    }, [entities, filter])

    const handleCreate = async (input: { name: string; description?: string }): Promise<void> => {
        if (!basePath) return
        const entity = await window.specData.create(basePath, input)
        onSelect(entity.id)
    }

    return (
        <div className="flex flex-col h-full gap-2 p-2">
            <div className="flex gap-1">
                <Input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={t('filter_entities')}
                    className="flex-1"
                />
                <Button
                    size="icon"
                    title={t('new_entity')}
                    onClick={() => setCreateOpen(true)}
                    disabled={!basePath}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            {onImportFromDb && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onImportFromDb}
                    disabled={!basePath}
                    className="justify-start"
                >
                    <Database className="h-4 w-4 mr-2" />
                    {t('import_from_db')}
                </Button>
            )}
            <ScrollArea className="flex-1">
                {loading ? (
                    <p className="p-2 text-xs text-muted-foreground">{t('loading')}</p>
                ) : filtered.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground space-y-1">
                        <p>{t('no_entities_yet')}</p>
                        <p>{t('no_entities_hint')}</p>
                    </div>
                ) : (
                    <ul className="space-y-px">
                        {filtered.map((e) => (
                            <li key={e.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(e.id)}
                                    className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted ${
                                        selectedId === e.id ? 'bg-muted font-medium' : ''
                                    }`}
                                >
                                    <FileBox className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{e.name}</span>
                                    {e.source.kind === 'imported' && (
                                        <Database
                                            className="h-3 w-3 ml-auto text-muted-foreground"
                                            aria-label={t('imported_from_db')}
                                        />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </ScrollArea>
            <EntityFormModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSubmit={handleCreate}
            />
        </div>
    )
}
