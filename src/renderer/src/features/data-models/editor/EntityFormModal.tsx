import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface EntityFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** When set, the modal acts as a rename form. */
    initialName?: string
    initialDescription?: string
    onSubmit: (input: { name: string; description?: string }) => Promise<void> | void
}

export function EntityFormModal({
    open,
    onOpenChange,
    initialName = '',
    initialDescription = '',
    onSubmit
}: EntityFormModalProps): React.ReactNode {
    const { t } = useTranslation()
    const [name, setName] = useState(initialName)
    const [description, setDescription] = useState(initialDescription)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setName(initialName)
            setDescription(initialDescription)
            setError(null)
        }
    }, [open, initialName, initialDescription])

    const handleSubmit = async (): Promise<void> => {
        const trimmed = name.trim()
        if (!trimmed) {
            setError(t('field_required'))
            return
        }
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(trimmed)) {
            setError(t('entity_name_invalid'))
            return
        }
        setSubmitting(true)
        try {
            await onSubmit({ name: trimmed, description: description.trim() || undefined })
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
            <IGRPDialogContentPrimitive>
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>
                        {initialName ? t('rename_entity') : t('new_entity')}
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {t('entity_form_description')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <div className="space-y-3 py-2">
                    <div className="space-y-1">
                        <IGRPLabelPrimitive htmlFor="entity-name">
                            {t('entity_name')}
                        </IGRPLabelPrimitive>
                        <IGRPInputPrimitive
                            id="entity-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Order"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1">
                        <IGRPLabelPrimitive htmlFor="entity-description">
                            {t('description')}
                        </IGRPLabelPrimitive>
                        <IGRPInputPrimitive
                            id="entity-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('optional')}
                        />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <IGRPDialogFooterPrimitive>
                    <IGRPButtonPrimitive
                        type="button"
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        {t('cancel')}
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive type="button" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? t('saving') : t('save')}
                    </IGRPButtonPrimitive>
                </IGRPDialogFooterPrimitive>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}
