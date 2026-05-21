import { forwardRef, type JSX } from 'react'
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DocPreviewProps {
    content: string
}

/**
 * Pulls `data-source-line` out of the remark AST `node.position`. Used
 * across every block-level renderer so the scroll-sync hook can map a
 * visible preview block back to the source line in the Monaco editor.
 *
 * Returned as a plain object spread (`{ ...sourceLineAttr(node) }`) to
 * keep the component bodies tiny and the types react-markdown-friendly.
 */
function sourceLineAttr(node: ExtraProps['node']): Record<string, number> {
    const line = node?.position?.start?.line
    return line !== undefined ? { 'data-source-line': line } : {}
}

const SOURCE_LINE_COMPONENTS: Components = {
    h1: ({ node, ...rest }) => <h1 {...sourceLineAttr(node)} {...rest} />,
    h2: ({ node, ...rest }) => <h2 {...sourceLineAttr(node)} {...rest} />,
    h3: ({ node, ...rest }) => <h3 {...sourceLineAttr(node)} {...rest} />,
    h4: ({ node, ...rest }) => <h4 {...sourceLineAttr(node)} {...rest} />,
    h5: ({ node, ...rest }) => <h5 {...sourceLineAttr(node)} {...rest} />,
    h6: ({ node, ...rest }) => <h6 {...sourceLineAttr(node)} {...rest} />,
    p: ({ node, ...rest }) => <p {...sourceLineAttr(node)} {...rest} />,
    ul: ({ node, ...rest }) => <ul {...sourceLineAttr(node)} {...rest} />,
    ol: ({ node, ...rest }) => <ol {...sourceLineAttr(node)} {...rest} />,
    blockquote: ({ node, ...rest }) => <blockquote {...sourceLineAttr(node)} {...rest} />,
    pre: ({ node, ...rest }) => <pre {...sourceLineAttr(node)} {...rest} />,
    table: ({ node, ...rest }) => <table {...sourceLineAttr(node)} {...rest} />,
    hr: ({ node, ...rest }) => <hr {...sourceLineAttr(node)} {...rest} />
}

export const DocPreview = forwardRef<HTMLDivElement, DocPreviewProps>(function DocPreview(
    { content },
    ref
): JSX.Element {
    if (!content.trim()) {
        return (
            <div ref={ref} className="flex h-full items-center justify-center p-8">
                <p className="text-xs italic text-muted-foreground">No content to preview.</p>
            </div>
        )
    }
    return (
        <div ref={ref} className="h-full overflow-y-auto bg-card/10">
            <div className="markdown-body prose prose-sm mx-auto max-w-2xl p-12 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={SOURCE_LINE_COMPONENTS}>
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    )
})
