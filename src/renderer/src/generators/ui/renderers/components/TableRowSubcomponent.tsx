import { cn } from '@renderer/lib/utils'
import { UnfoldVertical } from 'lucide-react'
import type React from 'react'
import type { CardComponentProps } from '../CardComponent'
import IGRPStudioContainer from './Container'

/**
 * Canvas preview for the engine's `tableRowSubcomponent` (child of `table`).
 * In generated code it becomes `getRowCanExpand={(row) => !!(rule)}` +
 * `renderSubComponent={(row) => <>{children}</>}` on IGRPDataTable — i.e.
 * the expanded-row content. On the canvas it renders as a panel: the `rule`
 * expression as a chip and a droppable body (Container delegate) for the
 * arbitrary children the expansion renders.
 */
const IGRPStudioTableRowSubcomponent: React.FC<CardComponentProps & { rule?: string }> = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
    className,
    rule
}) => (
    <div className={cn('w-full rounded-lg border border-dashed', className)}>
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-xs">
            <UnfoldVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="font-medium">Row Subcomponent</span>
            <span className="text-muted-foreground">
                rule: <code className="rounded bg-muted px-1">{rule || 'false'}</code>
            </span>
        </div>
        <IGRPStudioContainer
            comp={comp}
            group={group}
            hoverClass={hoverClass}
            onDragEnd={onDragEnd}
            className="min-h-16"
        />
    </div>
)

export default IGRPStudioTableRowSubcomponent
