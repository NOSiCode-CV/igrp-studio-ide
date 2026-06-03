import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { cn } from '@renderer/lib/utils'
import { type FormEvent, type JSX, useEffect, useRef, useState } from 'react'
import { DOC_TEMPLATES, findTemplate, type DocTemplate } from './templates'

export type DialogMode =
    | { kind: 'create'; type: 'file' | 'folder'; parentId?: string | null }
    | { kind: 'rename'; nodeId: string; current: string }

interface NewNodeDialogProps {
    open: boolean
    mode: DialogMode | null
    /**
     * Confirm callback. For `create+file` includes the chosen template (and
     * its content) so the caller can seed the file. For folder/rename only
     * `name` is meaningful.
     */
    onConfirm: (input: { name: string; template?: DocTemplate }) => Promise<void> | void
    onClose: () => void
}

export function NewNodeDialog({ open, mode, onConfirm, onClose }: NewNodeDialogProps): JSX.Element {
    const [value, setValue] = useState('')
    const [templateId, setTemplateId] = useState<string>('blank')
    const [submitting, setSubmitting] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const isCreatingFile = mode?.kind === 'create' && mode.type === 'file'

    useEffect(() => {
        if (!open || !mode) return
        let initial = ''
        if (mode.kind === 'rename') initial = mode.current
        else if (mode.type === 'folder') initial = 'New folder'
        else initial = findTemplate('blank').suggestedFilename
        setValue(initial)
        setTemplateId('blank')
        setTimeout(() => inputRef.current?.focus(), 50)
    }, [open, mode])

    // When the user picks a template, refresh the suggested filename — but
    // only if they haven't customised it yet (still matches the previous
    // template's suggestion).
    const handleTemplateChange = (nextId: string) => {
        const previous = findTemplate(templateId)
        const next = findTemplate(nextId)
        setTemplateId(nextId)
        if (value === previous.suggestedFilename) {
            setValue(next.suggestedFilename)
        }
    }

    const title =
        mode?.kind === 'rename' ? 'Rename' : mode?.type === 'folder' ? 'New folder' : 'New document'

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!value.trim() || !mode) return
        setSubmitting(true)
        try {
            const template = isCreatingFile ? findTemplate(templateId) : undefined
            await onConfirm({ name: value.trim(), template })
            onClose()
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[480px] max-w-[calc(100vw-2rem)] sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 px-1">
                    {isCreatingFile && (
                        <div className="space-y-2">
                            <Label>Template</Label>
                            <div className="grid max-h-[260px] grid-cols-2 gap-2 overflow-y-auto pr-1">
                                {DOC_TEMPLATES.map((tpl) => (
                                    <button
                                        type="button"
                                        key={tpl.id}
                                        onClick={() => handleTemplateChange(tpl.id)}
                                        className={cn(
                                            'rounded-md border p-3 text-left text-xs transition-colors',
                                            templateId === tpl.id
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:border-primary/40 hover:bg-accent/30'
                                        )}
                                    >
                                        <div className="font-medium leading-tight">{tpl.name}</div>
                                        <div className="mt-1 text-[11px] text-muted-foreground">
                                            {tpl.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            ref={inputRef}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={
                                mode?.kind === 'create' && mode.type === 'folder'
                                    ? 'My folder'
                                    : 'My document.md'
                            }
                            maxLength={120}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!value.trim() || submitting}>
                            {submitting ? 'Saving…' : title.replace('New ', 'Create ')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
