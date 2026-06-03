import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { AlertTriangle, CheckCircle2, Database, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDrift } from '../hooks/useDrift'
import { useEntities } from '../hooks/useEntities'
import { useEntity } from '../hooks/useEntity'
import { useDebouncedAutoSave } from '../hooks/useDebouncedAutoSave'
import type { Field, Relation } from '../types/entity'
import { FieldsTable } from './FieldsTable'
import { RelationsList } from './RelationsList'

interface EntityEditorProps {
    basePath: string
    entityId: string
    onDeleted?: () => void
}

export function EntityEditor({
    basePath,
    entityId,
    onDeleted
}: EntityEditorProps): React.ReactNode {
    const { t } = useTranslation()
    const { entity, loading } = useEntity(basePath, entityId)
    const { entities } = useEntities(basePath)
    const drift = useDrift(basePath, entityId)

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [fields, setFields] = useState<Field[]>([])
    const [relations, setRelations] = useState<Relation[]>([])
    const [dirty, setDirty] = useState(false)
    const [savedAt, setSavedAt] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Sync local state when the loaded entity changes (entityId switch or
    // refresh from a broadcast). Resets the dirty flag.
    useEffect(() => {
        if (!entity) return
        setName(entity.name)
        setDescription(entity.description ?? '')
        setFields(entity.fields)
        setRelations(entity.relations)
        setDirty(false)
        setError(null)
    }, [entity])

    const save = useCallback(
        async (payload: {
            name: string
            description: string
            fields: Field[]
            relations: Relation[]
        }) => {
            if (!entity) return
            // Skip if nothing actually changed (initial mount fires the effect too).
            if (
                payload.name === entity.name &&
                payload.description === (entity.description ?? '') &&
                payload.fields === entity.fields &&
                payload.relations === entity.relations
            ) {
                return
            }
            try {
                await window.specData.update(basePath, entityId, {
                    name: payload.name,
                    description: payload.description || undefined,
                    fields: payload.fields,
                    relations: payload.relations
                })
                setSavedAt(Date.now())
                setDirty(false)
                setError(null)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            }
        },
        [basePath, entityId, entity]
    )

    useDebouncedAutoSave({ name, description, fields, relations }, save, 600)

    useEffect(() => {
        if (!entity) return
        if (
            name === entity.name &&
            description === (entity.description ?? '') &&
            fields === entity.fields &&
            relations === entity.relations
        ) {
            return
        }
        setDirty(true)
    }, [name, description, fields, relations, entity])

    const handleDelete = async (): Promise<void> => {
        if (!confirm(t('confirm_delete_entity'))) return
        try {
            await window.specData.remove(basePath, entityId)
            onDeleted?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        }
    }

    const createJoinEntity = async (
        joinName: string,
        leftId: string,
        rightId: string
    ): Promise<string | null> => {
        const finalName = window.prompt(t('join_entity_name_prompt'), joinName)
        if (!finalName) return null
        try {
            const created = await window.specData.create(basePath, {
                name: finalName,
                description: `Join entity for ${joinName}`,
                fields: [
                    {
                        id: crypto.randomUUID(),
                        name: 'leftId',
                        type: 'reference',
                        primaryKey: true,
                        referenceEntityId: leftId
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'rightId',
                        type: 'reference',
                        primaryKey: true,
                        referenceEntityId: rightId
                    }
                ]
            })
            return created.id
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
            return null
        }
    }

    if (loading) {
        return <div className="p-4 text-sm text-muted-foreground">{t('loading')}</div>
    }
    if (!entity) {
        return <div className="p-4 text-sm text-muted-foreground">{t('entity_not_found')}</div>
    }

    const referenceTargets = entities.filter((e) => e.id !== entityId)

    return (
        <div className="flex flex-col h-full">
            <div className="border-b px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-base font-semibold flex-1"
                    />
                    {entity.source.kind === 'imported' && (
                        <>
                            <span
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                title={`${entity.source.connection} / ${entity.source.table}`}
                            >
                                <Database className="h-3 w-3" />
                                {t('imported')}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void drift.check()}
                                disabled={drift.loading}
                                title={t('check_drift')}
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 mr-1 ${drift.loading ? 'animate-spin' : ''}`}
                                />
                                {t('check_drift')}
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        title={t('delete_entity')}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
                <div>
                    <Label className="text-xs">{t('description')}</Label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('optional')}
                    />
                </div>
                <div className="text-[10px] text-muted-foreground h-4">
                    {error ? (
                        <span className="text-destructive">{error}</span>
                    ) : dirty ? (
                        t('saving_dots')
                    ) : savedAt ? (
                        t('saved_at', { time: new Date(savedAt).toLocaleTimeString() })
                    ) : null}
                </div>
                {drift.diff && entity.source.kind === 'imported' && (
                    <div
                        className={`text-xs rounded border p-2 ${
                            drift.diff.inSync
                                ? 'border-green-500/40 bg-green-500/5'
                                : 'border-amber-500/40 bg-amber-500/5'
                        }`}
                    >
                        {drift.diff.inSync ? (
                            <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t('drift_in_sync')}
                            </span>
                        ) : (
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    {t('drift_detected')}
                                </span>
                                <ul className="list-disc pl-5 space-y-0.5">
                                    {drift.diff.addedInDb.map((c) => (
                                        <li key={`add-${c.name}`}>
                                            {t('drift_added_in_db', { name: c.name, type: c.type })}
                                        </li>
                                    ))}
                                    {drift.diff.removedInDb.map((c) => (
                                        <li key={`rm-${c.name}`}>
                                            {t('drift_removed_in_db', { name: c.name })}
                                        </li>
                                    ))}
                                    {drift.diff.changed.map((c) => (
                                        <li key={`ch-${c.name}`}>
                                            {t('drift_changed', {
                                                name: c.name,
                                                before: c.before.type,
                                                after: c.after.type
                                            })}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={async () => {
                                        if (entity.source.kind !== 'imported') return
                                        if (!confirm(t('confirm_sync_from_db'))) return
                                        await window.specData.importFromDb(
                                            basePath,
                                            entity.source.connection,
                                            [entity.source.table]
                                        )
                                        drift.clear()
                                    }}
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    {t('sync_from_db')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Tabs defaultValue="fields" className="flex-1 flex flex-col">
                <TabsList className="px-4">
                    <TabsTrigger value="fields">
                        {t('entity_fields')} ({fields.length})
                    </TabsTrigger>
                    <TabsTrigger value="relations">
                        {t('relations')} ({relations.length})
                    </TabsTrigger>
                    <TabsTrigger value="sql">{t('sql_preview')}</TabsTrigger>
                    <TabsTrigger value="erd">{t('erd')}</TabsTrigger>
                </TabsList>
                <TabsContent value="fields" className="flex-1 overflow-auto px-4 py-3">
                    <FieldsTable
                        fields={fields}
                        referenceTargets={referenceTargets}
                        onChange={setFields}
                    />
                </TabsContent>
                <TabsContent value="relations" className="flex-1 overflow-auto px-4 py-3">
                    <RelationsList
                        entityId={entityId}
                        relations={relations}
                        targets={referenceTargets}
                        onChange={setRelations}
                        createJoinEntity={createJoinEntity}
                    />
                </TabsContent>
                <TabsContent value="sql" className="flex-1 overflow-auto px-4 py-3">
                    <p className="text-xs text-muted-foreground">{t('ddl_preview_pending')}</p>
                </TabsContent>
                <TabsContent value="erd" className="flex-1 overflow-auto px-4 py-3">
                    <p className="text-xs text-muted-foreground">{t('erd_per_entity_pending')}</p>
                </TabsContent>
            </Tabs>
        </div>
    )
}
