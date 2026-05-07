import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import { Check, Copy, FolderOpen, Save, Trash2 } from 'lucide-react'
import { type JSX, useState } from 'react'

interface ToolbarProps {
    markdown: string
    fileName: string | null
    disabled?: boolean
    onPickFile: () => void
    onClear: () => void
}

const Toolbar = ({
    markdown,
    fileName,
    disabled = false,
    onPickFile,
    onClear
}: ToolbarProps): JSX.Element => {
    const [copied, setCopied] = useState(false)
    const hasMarkdown = markdown.length > 0

    const handleCopy = async (): Promise<void> => {
        if (!hasMarkdown) return
        try {
            await navigator.clipboard.writeText(markdown)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            /* clipboard unavailable */
        }
    }

    const handleSave = async (): Promise<void> => {
        if (!hasMarkdown) return
        const suggestedName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'converted'
        await window.markitdown.saveMarkdown({ markdown, suggestedName })
    }

    return (
        <div className="flex items-center gap-2">
            <IGRPButtonPrimitive
                size="sm"
                variant="default"
                onClick={onPickFile}
                disabled={disabled}
            >
                <FolderOpen className="h-4 w-4 mr-2" />
                Choose file
            </IGRPButtonPrimitive>
            <IGRPButtonPrimitive
                size="sm"
                variant="outline"
                onClick={handleCopy}
                disabled={!hasMarkdown}
            >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied' : 'Copy'}
            </IGRPButtonPrimitive>
            <IGRPButtonPrimitive
                size="sm"
                variant="outline"
                onClick={handleSave}
                disabled={!hasMarkdown}
            >
                <Save className="h-4 w-4 mr-2" />
                Save as .md
            </IGRPButtonPrimitive>
            <IGRPButtonPrimitive
                size="sm"
                variant="ghost"
                onClick={onClear}
                disabled={!hasMarkdown && !fileName}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
            </IGRPButtonPrimitive>
        </div>
    )
}

export default Toolbar
