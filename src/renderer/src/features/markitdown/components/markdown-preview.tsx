import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { FileText } from 'lucide-react'
import { type JSX, useMemo } from 'react'
import { renderMarkdownToSafeHtml } from '../utils/markdown-renderer'
import './markdown-preview.css'

interface MarkdownPreviewProps {
    markdown: string
    emptyLabel?: string
}

const MarkdownPreview = ({
    markdown,
    emptyLabel = 'Preview will appear here.'
}: MarkdownPreviewProps): JSX.Element => {
    const html = useMemo(() => (markdown ? renderMarkdownToSafeHtml(markdown) : ''), [markdown])

    if (!markdown) {
        return (
            <div className="md-preview flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground p-6">
                <FileText className="h-8 w-8 opacity-40" />
                <span>{emptyLabel}</span>
            </div>
        )
    }

    return (
        <div className="md-preview h-full">
            <ScrollArea className="h-full">
                <article
                    className="prose prose-sm dark:prose-invert max-w-3xl mx-auto px-8 py-8"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify in renderMarkdownToSafeHtml
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </ScrollArea>
        </div>
    )
}

export default MarkdownPreview
