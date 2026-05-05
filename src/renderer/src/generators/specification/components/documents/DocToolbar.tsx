import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import type { DocViewMode } from '@renderer/redux/specDocs/reducer'
import {
    ChevronRight,
    Columns2,
    Download,
    Edit3,
    Eye,
    FileText,
    Loader2,
    MessageSquare
} from 'lucide-react'
import { type JSX, useEffect, useRef, useState } from 'react'

export type DocExportFormat = 'pdf' | 'docx'

interface DocToolbarProps {
    breadcrumbs: string[]
    docName: string
    viewMode: DocViewMode
    onViewModeChange: (mode: DocViewMode) => void
    chatOpen: boolean
    onToggleChat: () => void
    onExport?: (format: DocExportFormat) => Promise<void> | void
    canExport?: boolean
}

export function DocToolbar({
    breadcrumbs,
    docName,
    viewMode,
    onViewModeChange,
    chatOpen,
    onToggleChat,
    onExport,
    canExport = true
}: DocToolbarProps): JSX.Element {
    return (
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                {breadcrumbs.map((crumb, idx) => (
                    <span key={`${crumb}-${idx}`} className="flex items-center gap-2">
                        <span className="hover:text-foreground cursor-pointer">{crumb}</span>
                        <ChevronRight size={12} />
                    </span>
                ))}
                <span className="truncate font-medium text-foreground" title={docName}>
                    {docName}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border bg-card p-1">
                    <ToolbarButton
                        active={viewMode === 'edit'}
                        onClick={() => onViewModeChange('edit')}
                        icon={<Edit3 size={12} />}
                        label="Edit"
                    />
                    <ToolbarButton
                        active={viewMode === 'preview'}
                        onClick={() => onViewModeChange('preview')}
                        icon={<Eye size={12} />}
                        label="Preview"
                    />
                    <ToolbarButton
                        active={viewMode === 'split'}
                        onClick={() => onViewModeChange('split')}
                        icon={<Columns2 size={12} />}
                        label="Split"
                    />
                </div>
                <ExportMenu
                    onExport={onExport}
                    disabled={!onExport || !canExport}
                />
                <IGRPButtonPrimitive
                    variant={chatOpen ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={onToggleChat}
                    title="AI Assistant"
                >
                    <MessageSquare
                        size={14}
                        className={cn(chatOpen ? 'text-primary' : '')}
                    />
                    Assistant
                </IGRPButtonPrimitive>
            </div>
        </div>
    )
}

function ExportMenu({
    onExport,
    disabled
}: {
    onExport?: (format: DocExportFormat) => Promise<void> | void
    disabled?: boolean
}): JSX.Element {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState<DocExportFormat | null>(null)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (event: MouseEvent) => {
            if (!ref.current?.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const trigger = async (format: DocExportFormat) => {
        if (!onExport) return
        setOpen(false)
        setBusy(format)
        try {
            await onExport(format)
        } finally {
            setBusy(null)
        }
    }

    return (
        <div ref={ref} className="relative">
            <IGRPButtonPrimitive
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-xs"
                onClick={() => setOpen((v) => !v)}
                disabled={disabled || busy !== null}
                title="Export this document"
            >
                {busy ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <Download size={14} />
                )}
                Export
            </IGRPButtonPrimitive>
            {open && (
                <div className="absolute right-0 top-9 z-30 w-44 rounded-md border bg-popover p-1 shadow-md">
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                        onClick={() => trigger('pdf')}
                    >
                        <FileText size={12} className="text-red-500" />
                        Export as PDF…
                    </button>
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                        onClick={() => trigger('docx')}
                    >
                        <FileText size={12} className="text-blue-500" />
                        Export as Word (.docx)…
                    </button>
                </div>
            )}
        </div>
    )
}

const ToolbarButton = ({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    label: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex h-7 items-center gap-1.5 rounded px-2 text-[10px] font-medium transition-colors',
            active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
        {label}
    </button>
)
