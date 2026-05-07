import { Check } from 'lucide-react'
import type { JSX } from 'react'

interface DocFooterProps {
    content: string
    saving: boolean
    dirty: boolean
}

export function DocFooter({ content, saving, dirty }: DocFooterProps): JSX.Element {
    const words = content.trim().split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.ceil(words / 200))

    return (
        <footer className="flex h-8 shrink-0 items-center justify-between border-t bg-card px-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-4">
                <span>{words} words</span>
                <span>~{minutes} min read</span>
                <span className="flex items-center gap-1">
                    {saving ? (
                        'Saving…'
                    ) : dirty ? (
                        'Unsaved changes'
                    ) : (
                        <>
                            <Check size={10} className="text-emerald-500" /> Saved
                        </>
                    )}
                </span>
            </div>
        </footer>
    )
}
