import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPLabelPrimitive,
    IGRPRadioGroupItemPrimitive,
    IGRPRadioGroupPrimitive,
    IGRPTextAreaPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { convertJsonSchemaToForm } from '@igrp/igrp-studio-nextjs-engine'
import useToast from '@renderer/hooks/useToast'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { getUUID } from '@renderer/utils'
import { type JSX, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type ImportMode = 'replace' | 'append'

interface ImportJsonSchemaModalProps {
    isOpen: boolean
    onClose: () => void
    /**
     * Called with the converted components ready to be set as the form's
     * children (IDs already regenerated). The host decides how to apply
     * — typically via handleUpdateChildComponent(formId, { children }).
     */
    onConfirm: (children: StructuredComponent[], mode: ImportMode) => void
    /** Existing children count — drives the replace/append radio. */
    existingChildrenCount: number
}

/**
 * Recursively assigns fresh UUIDs to every node in the tree so a
 * second import does not collide with components already on the canvas.
 */
function regenerateIds<T extends { id?: string; children?: T[] }>(node: T): T {
    return {
        ...node,
        id: getUUID(),
        ...(Array.isArray(node.children)
            ? { children: node.children.map(regenerateIds) }
            : {})
    }
}

export function ImportJsonSchemaModal({
    isOpen,
    onClose,
    onConfirm,
    existingChildrenCount
}: ImportJsonSchemaModalProps): JSX.Element {
    const { t } = useTranslation()
    const { showErrorToast } = useToast()

    const [raw, setRaw] = useState('')
    const [mode, setMode] = useState<ImportMode>('replace')

    useEffect(() => {
        if (!isOpen) {
            setRaw('')
            setMode('replace')
        }
    }, [isOpen])

    /**
     * Parse + convert lazily so the preview count and the error state
     * react instantly to user edits without leaking the conversion to
     * the confirm path.
     */
    const { components, parseError, schemaError } = useMemo(() => {
        if (!raw.trim()) {
            return {
                components: null as StructuredComponent[] | null,
                parseError: null as string | null,
                schemaError: null as string | null
            }
        }
        let parsed: unknown
        try {
            parsed = JSON.parse(raw)
        } catch (e) {
            return {
                components: null,
                parseError: (e as Error).message,
                schemaError: null
            }
        }
        try {
            const converted = convertJsonSchemaToForm(parsed as never) as StructuredComponent[]
            return {
                components: converted.map(regenerateIds),
                parseError: null,
                schemaError: null
            }
        } catch (e) {
            return {
                components: null,
                parseError: null,
                schemaError: (e as Error).message
            }
        }
    }, [raw])

    const canConfirm = !!components && components.length > 0

    const handleConfirm = (): void => {
        if (!components) {
            showErrorToast(t('import_schema_no_components'))
            return
        }
        onConfirm(components, mode)
        onClose()
    }

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <IGRPDialogContentPrimitive className="sm:max-w-[640px] max-w-[90vw]">
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>{t('import_schema_title')}</IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {t('import_schema_description')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <IGRPLabelPrimitive htmlFor="schema">
                            {t('import_schema_label')}
                        </IGRPLabelPrimitive>
                        <IGRPTextAreaPrimitive
                            id="schema"
                            value={raw}
                            onChange={(e) => setRaw(e.target.value)}
                            placeholder={'{\n  "type": "object",\n  "properties": { ... }\n}'}
                            className="font-mono text-xs h-56"
                        />
                    </div>

                    {parseError && (
                        <p className="text-xs text-destructive">
                            {t('import_schema_parse_error', { error: parseError })}
                        </p>
                    )}
                    {schemaError && (
                        <p className="text-xs text-destructive">
                            {t('import_schema_engine_error', { error: schemaError })}
                        </p>
                    )}
                    {components && (
                        <p className="text-xs text-muted-foreground">
                            {t('import_schema_preview', { count: components.length })}
                        </p>
                    )}

                    {existingChildrenCount > 0 && (
                        <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                            <IGRPLabelPrimitive className="text-sm">
                                {t('import_schema_mode_label', { count: existingChildrenCount })}
                            </IGRPLabelPrimitive>
                            <IGRPRadioGroupPrimitive
                                value={mode}
                                onValueChange={(v) => setMode(v as ImportMode)}
                            >
                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <IGRPRadioGroupItemPrimitive value="replace" id="mode-replace" />
                                    <span>{t('import_schema_mode_replace')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <IGRPRadioGroupItemPrimitive value="append" id="mode-append" />
                                    <span>{t('import_schema_mode_append')}</span>
                                </label>
                            </IGRPRadioGroupPrimitive>
                        </div>
                    )}
                </div>

                <IGRPDialogFooterPrimitive>
                    <IGRPButtonPrimitive variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive onClick={handleConfirm} disabled={!canConfirm}>
                        {t('import_schema_confirm')}
                    </IGRPButtonPrimitive>
                </IGRPDialogFooterPrimitive>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}
