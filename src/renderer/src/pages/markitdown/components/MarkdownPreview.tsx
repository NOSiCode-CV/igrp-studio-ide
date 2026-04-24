import { IGRPScrollAreaPrimitive } from '@igrp/igrp-framework-react-design-system'
import { type JSX, useMemo } from 'react'
import { renderMarkdownToSafeHtml } from '../utils/markdown-renderer'

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
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-6">
                {emptyLabel}
            </div>
        )
    }

    return (
        <IGRPScrollAreaPrimitive className="h-full">
            <div
                className="prose prose-sm dark:prose-invert max-w-none p-4"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify in renderMarkdownToSafeHtml
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </IGRPScrollAreaPrimitive>
    )
}

export default MarkdownPreview
