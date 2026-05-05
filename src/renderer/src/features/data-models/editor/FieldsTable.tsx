import {
    IGRPButtonPrimitive,
    IGRPCheckboxPrimitive,
    IGRPCombobox,
    IGRPInputPrimitive,
    IGRPTableBodyPrimitive,
    IGRPTableCellPrimitive,
    IGRPTableHeadPrimitive,
    IGRPTableHeaderPrimitive,
    IGRPTablePrimitive,
    IGRPTableRowPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { EntitySummary, Field, FieldType } from '../types/entity'

const FIELD_TYPES: FieldType[] = [
    'string',
    'int',
    'decimal',
    'boolean',
    'date',
    'datetime',
    'json',
    'enum',
    'reference'
]

interface FieldsTableProps {
    fields: Field[]
    /**
     * All entities in the project — used to populate the reference target
     * combobox. Excludes the entity being edited so a field can't reference
     * its own row.
     */
    referenceTargets: EntitySummary[]
    onChange: (fields: Field[]) => void
}

export function FieldsTable({
    fields,
    referenceTargets,
    onChange
}: FieldsTableProps): React.ReactNode {
    const { t } = useTranslation()

    const typeOptions = useMemo(
        () => FIELD_TYPES.map((type) => ({ label: type, value: type })),
        []
    )
    const referenceOptions = useMemo(
        () => referenceTargets.map((e) => ({ label: e.name, value: e.id })),
        [referenceTargets]
    )

    const update = (index: number, patch: Partial<Field>): void => {
        onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)))
    }

    const remove = (index: number): void => {
        onChange(fields.filter((_, i) => i !== index))
    }

    const add = (): void => {
        onChange([
            ...fields,
            {
                id: crypto.randomUUID(),
                name: `field${fields.length + 1}`,
                type: 'string',
                nullable: true
            }
        ])
    }

    const duplicateName = (name: string, currentIndex: number): boolean => {
        const trimmed = name.trim().toLowerCase()
        if (!trimmed) return false
        return fields.some(
            (f, i) => i !== currentIndex && f.name.trim().toLowerCase() === trimmed
        )
    }

    return (
        <div className="space-y-2">
            <IGRPTablePrimitive>
                <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                        <IGRPTableHeadPrimitive>{t('field_name')}</IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>{t('field_type')}</IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive className="w-16 text-center">
                            {t('field_pk')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive className="w-20 text-center">
                            {t('field_nullable')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive className="w-20 text-center">
                            {t('field_unique')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive className="w-20 text-center">
                            {t('field_indexed')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>{t('field_default')}</IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>{t('field_extra')}</IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive className="w-10" />
                    </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                <IGRPTableBodyPrimitive>
                    {fields.length === 0 ? (
                        <IGRPTableRowPrimitive>
                            <IGRPTableCellPrimitive
                                colSpan={9}
                                className="text-center text-xs text-muted-foreground py-6"
                            >
                                {t('no_fields_yet')}
                            </IGRPTableCellPrimitive>
                        </IGRPTableRowPrimitive>
                    ) : (
                        fields.map((field, index) => {
                            const dup = duplicateName(field.name, index)
                            return (
                                <IGRPTableRowPrimitive key={field.id}>
                                    <IGRPTableCellPrimitive>
                                        <IGRPInputPrimitive
                                            value={field.name}
                                            onChange={(e) =>
                                                update(index, { name: e.target.value })
                                            }
                                            className={dup ? 'border-destructive' : ''}
                                            aria-invalid={dup}
                                        />
                                        {dup && (
                                            <span className="text-[10px] text-destructive">
                                                {t('field_name_duplicate')}
                                            </span>
                                        )}
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive>
                                        <IGRPCombobox
                                            value={field.type}
                                            onChange={(v) =>
                                                update(index, { type: v as FieldType })
                                            }
                                            options={typeOptions}
                                            placeholder={t('field_type')}
                                            className="w-full"
                                        />
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive className="text-center">
                                        <IGRPCheckboxPrimitive
                                            checked={!!field.primaryKey}
                                            onCheckedChange={(checked) =>
                                                update(index, {
                                                    primaryKey: !!checked,
                                                    nullable: checked ? false : field.nullable
                                                })
                                            }
                                        />
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive className="text-center">
                                        <IGRPCheckboxPrimitive
                                            checked={field.nullable !== false}
                                            disabled={!!field.primaryKey}
                                            onCheckedChange={(checked) =>
                                                update(index, { nullable: !!checked })
                                            }
                                        />
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive className="text-center">
                                        <IGRPCheckboxPrimitive
                                            checked={!!field.unique}
                                            onCheckedChange={(checked) =>
                                                update(index, { unique: !!checked })
                                            }
                                        />
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive className="text-center">
                                        <IGRPCheckboxPrimitive
                                            checked={!!field.indexed}
                                            onCheckedChange={(checked) =>
                                                update(index, { indexed: !!checked })
                                            }
                                        />
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive>
                                        <IGRPInputPrimitive
                                            value={
                                                field.defaultValue == null
                                                    ? ''
                                                    : String(field.defaultValue)
                                            }
                                            onChange={(e) =>
                                                update(index, {
                                                    defaultValue:
                                                        e.target.value === '' ? null : e.target.value
                                                })
                                            }
                                            placeholder="—"
                                        />
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive>
                                        {field.type === 'reference' ? (
                                            <IGRPCombobox
                                                value={field.referenceEntityId ?? ''}
                                                onChange={(v) =>
                                                    update(index, {
                                                        referenceEntityId: (v as string) || undefined
                                                    })
                                                }
                                                options={referenceOptions}
                                                placeholder={t('field_target_entity')}
                                                className="w-full"
                                            />
                                        ) : field.type === 'enum' ? (
                                            <IGRPInputPrimitive
                                                value={(field.enumValues ?? []).join(', ')}
                                                onChange={(e) =>
                                                    update(index, {
                                                        enumValues: e.target.value
                                                            .split(',')
                                                            .map((s) => s.trim())
                                                            .filter(Boolean)
                                                    })
                                                }
                                                placeholder="A, B, C"
                                            />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </IGRPTableCellPrimitive>
                                    <IGRPTableCellPrimitive>
                                        <IGRPButtonPrimitive
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            title={t('delete')}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </IGRPButtonPrimitive>
                                    </IGRPTableCellPrimitive>
                                </IGRPTableRowPrimitive>
                            )
                        })
                    )}
                </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
            <IGRPButtonPrimitive variant="secondary" size="sm" onClick={add}>
                <Plus className="h-4 w-4 mr-1" />
                {t('add_field')}
            </IGRPButtonPrimitive>
        </div>
    )
}
