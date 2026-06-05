/**
 * Pure helpers for the Files pane's Monaco viewer.
 *
 *   - `languageFromExt` maps a file path to a Monaco language id by
 *     extension. Unknown extensions collapse to `plaintext` so Monaco
 *     still renders the buffer without tokenising.
 *
 *   - `monacoOptions` is the read-only configuration the viewer feeds
 *     to `<MonacoEditor>` and `<DiffEditor>`. JetBrains-Mono-first
 *     font stack, no minimap, soft wrap on, line-highlight off (it
 *     fights the diff gutter), generous padding.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P2 — pure helper functions).
 */
export const languageFromExt = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    switch (ext) {
        case 'ts':
        case 'tsx':
            return 'typescript'
        case 'js':
        case 'jsx':
        case 'mjs':
        case 'cjs':
            return 'javascript'
        case 'json':
            return 'json'
        case 'md':
        case 'markdown':
            return 'markdown'
        case 'css':
            return 'css'
        case 'scss':
        case 'sass':
            return 'scss'
        case 'html':
        case 'htm':
            return 'html'
        case 'yml':
        case 'yaml':
            return 'yaml'
        case 'sh':
        case 'bash':
        case 'zsh':
            return 'shell'
        case 'sql':
            return 'sql'
        case 'py':
            return 'python'
        case 'rb':
            return 'ruby'
        case 'go':
            return 'go'
        case 'rs':
            return 'rust'
        default:
            return 'plaintext'
    }
}

export const monacoOptions = {
    readOnly: true,
    fontSize: 13,
    fontFamily:
        'JetBrains Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    minimap: { enabled: false },
    wordWrap: 'on' as const,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'none' as const,
    folding: true,
    glyphMargin: false,
    padding: { top: 12, bottom: 12 }
}
