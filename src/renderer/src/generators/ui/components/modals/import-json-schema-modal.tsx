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
import useToast from '@renderer/hooks/useToast'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { getUUID } from '@renderer/utils'
import { type JSX, useEffect, useState } from 'react'
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
    const [components, setComponents] = useState<StructuredComponent[] | null>(null)
    const [parseError, setParseError] = useState<string | null>(null)
    const [schemaError, setSchemaError] = useState<string | null>(null)
    const [isConverting, setIsConverting] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            setRaw('')
            setMode('replace')
            setComponents(null)
            setParseError(null)
            setSchemaError(null)
        }
    }, [isOpen])

    /**
     * Convert through the engine over IPC. The engine bundles fs-extra
     * (used by its codegen path) which can't load in the renderer, so
     * the conversion has to round-trip through main. Debounced via the
     * raw input change cycle so stale results never overwrite a fresh
     * one.
     */
    useEffect(() => {
        if (!raw.trim()) {
            setComponents(null)
            setParseError(null)
            setSchemaError(null)
            return
        }

        let parsed: unknown
        try {
            parsed = JSON.parse(raw)
        } catch (e) {
            setComponents(null)
            setParseError((e as Error).message)
            setSchemaError(null)
            return
        }

        let cancelled = false
        setIsConverting(true)
        setParseError(null)
        setSchemaError(null)

        ;(async () => {
            try {
                const result = (await window.engine.convertJsonSchema(parsed)) as
                    | { result?: StructuredComponent[]; error?: string }
                    | StructuredComponent[]
                if (cancelled) return

                // Engine handler returns the array directly via
                // handleWithCustomErrors success path; defensive in case
                // an envelope sneaks in.
                const list = Array.isArray(result) ? result : (result.result ?? null)
                const errMsg = !Array.isArray(result) ? result.error : null

                if (errMsg) {
                    setComponents(null)
                    setSchemaError(errMsg)
                } else if (list) {
                    setComponents(list.map(regenerateIds))
                    setSchemaError(null)
                }
            } catch (e) {
                if (!cancelled) {
                    setComponents(null)
                    setSchemaError((e as Error).message)
                }
            } finally {
                if (!cancelled) setIsConverting(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [raw])

    const canConfirm = !!components && components.length > 0 && !isConverting

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
