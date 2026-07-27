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
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    permissionKeyPlaceholder,
    suggestPermissionKey,
    type PermissionKeySuggestionContext
} from './suggestPermissionKey'
import type { CreatePermissionInput } from './types'

interface CreatePermissionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: (input: CreatePermissionInput) => void | Promise<void>
    title?: string
    initialKey?: string
    initialLabel?: string
    initialDescription?: string
    suggestionContext?: PermissionKeySuggestionContext
}

export function CreatePermissionDialog({
    open,
    onOpenChange,
    onCreated,
    title,
    initialKey = '',
    initialLabel = '',
    initialDescription = '',
    suggestionContext
}: CreatePermissionDialogProps) {
    const { t } = useTranslation()
    const suggestion = useMemo(
        () => suggestPermissionKey(suggestionContext),
        [suggestionContext]
    )
    const keyPlaceholder = useMemo(
        () => permissionKeyPlaceholder(suggestionContext),
        [suggestionContext]
    )
    const [key, setKey] = useState(initialKey)
    const [label, setLabel] = useState(initialLabel)
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) {
            setKey(initialKey || suggestion.key)
            setLabel(initialLabel || suggestion.label)
            setDescription(initialDescription)
            setError('')
            setSaving(false)
        }
    }, [open, initialKey, initialLabel, initialDescription, suggestion.key, suggestion.label])

    const handleSave = async () => {
        const trimmedKey = key.trim()
        if (!trimmedKey) {
            setError(t('permissionKeyRequired', 'Permission key is required.'))
            return
        }
        if (!/^[a-z][a-z0-9_.]*$/.test(trimmedKey)) {
            setError(
                t(
                    'permissionKeyInvalid',
                    'Use lowercase letters, numbers, dots and underscores (e.g. app.page.action).'
                )
            )
            return
        }
        if (!label.trim()) {
            setError(t('permissionLabelRequired', 'Label is required.'))
            return
        }
        setSaving(true)
        setError('')
        try {
            await onCreated({
                key: trimmedKey,
                label: label.trim(),
                description: description.trim() || undefined
            })
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {title ?? t('createPermission', 'New permission')}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'createPermissionDesc',
                            'Saves to .igrpstudio/permissions.json in the project.'
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="space-y-1.5">
                        <Label htmlFor="perm-key">
                            {t('permissionKey', 'Key')}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="perm-key"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder={keyPlaceholder}
                            className="font-mono"
                        />
                        <p className="text-[11px] text-muted-foreground font-mono">
                            {t('permissionKeyConvention', 'Convention: app.page.actionName')}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="perm-label">
                            {t('permissionLabel', 'Label')}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="perm-label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder={t('permissionLabelPlaceholder', 'Eliminar fatura')}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="perm-desc">{t('description', 'Description')}</Label>
                        <Input
                            id="perm-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    {key.trim() && (
                        <p className="text-xs text-muted-foreground font-mono">
                            preview: can(&apos;{key.trim()}&apos;)
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {t('cancel', 'Cancel')}
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={saving}>
                        {saving ? t('saving', 'Saving…') : t('save', 'Save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
