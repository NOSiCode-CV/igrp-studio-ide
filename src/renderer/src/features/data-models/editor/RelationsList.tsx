import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@renderer/components/ui/table'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EntitySummary, Relation, RelationKind } from '../types/entity'

const RELATION_KINDS: RelationKind[] = ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']

interface RelationsListProps {
    entityId: string
    relations: Relation[]
    /** Other entities the user can target. Excludes the entity being edited. */
    targets: EntitySummary[]
    onChange: (relations: Relation[]) => void
    /**
     * Hook the editor wires to actually create the join entity in the project
     * store before adding the relation. Returns the new entity's id (or null
     * if creation was cancelled / failed).
     */
    createJoinEntity: (name: string, leftId: string, rightId: string) => Promise<string | null>
}

export function RelationsList({
    entityId,
    relations,
    targets,
    onChange,
    createJoinEntity
}: RelationsListProps): React.ReactNode {
    const { t } = useTranslation()
    const [draftKind, setDraftKind] = useState<RelationKind>('many-to-one')
    const [draftTarget, setDraftTarget] = useState<string>('')
    const [autoJoin, setAutoJoin] = useState<boolean>(true)
    const [busy, setBusy] = useState(false)

    const kindOptions = useMemo(() => RELATION_KINDS.map((k) => ({ label: k, value: k })), [])
    const targetOptions = useMemo(
        () => targets.map((e) => ({ label: e.name, value: e.id })),
        [targets]
    )

    const targetName = (id: string): string => {
        const found = targets.find((e) => e.id === id)
        return found?.name ?? '?'
    }

    const handleAdd = async (): Promise<void> => {
        if (!draftTarget) return
        setBusy(true)
        try {
            let joinEntityId: string | undefined
            if (draftKind === 'many-to-many' && autoJoin) {
                const left = targets.find((e) => e.id === entityId)?.name ?? 'Left'
                const right = targetName(draftTarget)
                const created = await createJoinEntity(`${left}${right}`, entityId, draftTarget)
                if (!created) return
                joinEntityId = created
            }
            const next: Relation = {
                id: crypto.randomUUID(),
                kind: draftKind,
                fromEntityId: entityId,
                toEntityId: draftTarget,
                joinEntityId
            }
            onChange([...relations, next])
            setDraftTarget('')
        } finally {
            setBusy(false)
        }
    }

    const handleRemove = (id: string): void => {
        onChange(relations.filter((r) => r.id !== id))
    }

    return (
        <div className="space-y-3">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('relation_kind')}</TableHead>
                        <TableHead>{t('relation_target')}</TableHead>
                        <TableHead>{t('relation_join_entity')}</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {relations.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="text-center text-xs text-muted-foreground py-6"
                            >
                                {t('no_relations_yet')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        relations.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{r.kind}</TableCell>
                                <TableCell>{targetName(r.toEntityId)}</TableCell>
                                <TableCell>
                                    {r.joinEntityId ? (
                                        targetName(r.joinEntityId)
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemove(r.id)}
                                        title={t('delete')}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <div className="border rounded p-3 space-y-2 bg-muted/30">
                <div className="text-xs font-medium text-muted-foreground">{t('add_relation')}</div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs">{t('relation_kind')}</Label>
                        <IGRPCombobox
                            value={draftKind}
                            onChange={(v) => setDraftKind(v as RelationKind)}
                            options={kindOptions}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">{t('relation_target')}</Label>
                        <IGRPCombobox
                            value={draftTarget}
                            onChange={(v) => setDraftTarget(v as string)}
                            options={targetOptions}
                            placeholder={t('select_entity')}
                            className="w-full"
                        />
                    </div>
                </div>
                {draftKind === 'many-to-many' && (
                    <label className="flex items-center gap-2 text-xs">
                        <Checkbox checked={autoJoin} onCheckedChange={(c) => setAutoJoin(!!c)} />
                        <span>{t('auto_create_join_entity')}</span>
                    </label>
                )}
                <Button size="sm" onClick={handleAdd} disabled={!draftTarget || busy}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('add_relation')}
                </Button>
            </div>
        </div>
    )
}
