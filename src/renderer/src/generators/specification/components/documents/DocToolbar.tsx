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
                <IGRPButtonPrimitive
                    variant={chatOpen ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={onToggleChat}
                    title="AI Assistant (coming soon)"
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
