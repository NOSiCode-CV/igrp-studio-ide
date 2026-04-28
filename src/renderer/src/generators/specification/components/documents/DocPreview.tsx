import type { JSX } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DocPreviewProps {
    content: string
}

export function DocPreview({ content }: DocPreviewProps): JSX.Element {
    if (!content.trim()) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <p className="text-xs italic text-muted-foreground">No content to preview.</p>
            </div>
        )
    }
    return (
        <div className="h-full overflow-y-auto bg-card/10">
            <div className="markdown-body prose prose-sm mx-auto max-w-2xl p-12 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
        </div>
    )
}
