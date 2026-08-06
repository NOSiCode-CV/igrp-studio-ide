import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialName ? t('rename_entity') : t('new_entity')}</DialogTitle>
                    <DialogDescription>{t('entity_form_description')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="space-y-1">
                        <Label htmlFor="entity-name">{t('entity_name')}</Label>
                        <Input
                            id="entity-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Order"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="entity-description">{t('description')}</Label>
                        <Input
                            id="entity-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('optional')}
                        />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        {t('cancel')}
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? t('saving') : t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
