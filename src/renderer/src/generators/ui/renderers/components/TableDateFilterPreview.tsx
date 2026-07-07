import { cn } from '@renderer/lib/utils'
import { CalendarIcon } from 'lucide-react'

interface TableDateFilterPreviewProps {
    className?: string
    placeholder?: string
}

/**
 * Editor-only preview for the table Date filter.
 *
 * The design-system `IGRPDataTableFilterDate` currently returns `null` (the
 * real date-range picker is commented out / TODO upstream), so on the canvas
 * the component is invisible and authors can only find it on hover. This
 * placeholder gives it a visible, date-range-picker-like surface so it can be
 * seen, positioned and configured. It is purely presentational — generation
 * is unaffected (COMPONENT_MAP only feeds the canvas renderer).
 */
const IGRPStudioTableDateFilterPreview = ({
    className,
    placeholder = 'Selecionar datas...'
}: TableDateFilterPreviewProps) => {
    return (
        <div
            className={cn(
                'inline-flex h-9 w-full min-w-48 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground',
                className
            )}
        >
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{placeholder}</span>
        </div>
    )
}

export default IGRPStudioTableDateFilterPreview
