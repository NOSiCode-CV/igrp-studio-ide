import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@renderer/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { browserCardClassName } from '@renderer/generators/ui/browser/browser-card-styles'
import { Calendar, Info, UserCog } from 'lucide-react'
import type { JSX } from 'react/jsx-runtime'
import type { BPMNAuditUser, BPMNDateLike, BPMNProjectProcessDefinition } from 'src/main/types'

interface ProcessCardProps {
    process: BPMNProjectProcessDefinition
    isSelected: boolean
    onSelectProcess: (process: BPMNProjectProcessDefinition) => void
}

/**
 * Process API serialises timestamps as Java `LocalDateTime` arrays
 * (`[year, month, day, hour, minute, second, nanos]`). Some endpoints still
 * return ISO strings — handle both gracefully.
 */
function toDate(value: BPMNDateLike | undefined): Date | null {
    if (value == null) return null
    if (Array.isArray(value)) {
        if (value.length < 3) return null
        const [year, month, day, hour = 0, minute = 0, second = 0, nanos = 0] = value
        const ms = Math.floor(Number(nanos) / 1_000_000)
        const d = new Date(year, (month ?? 1) - 1, day, hour, minute, second, ms)
        return Number.isNaN(d.getTime()) ? null : d
    }
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(value: BPMNDateLike | undefined): string {
    const date = toDate(value)
    if (!date) return '—'
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * `createdBy` / `lastModifiedBy` may arrive either as a string (legacy) or as
 * a user object (`{ id, username, email, fullName, … }`) — extract a single
 * display name + secondary identifier (username/email) for the popover.
 */
function resolveAuditUser(by: BPMNAuditUser | string | undefined): {
    name: string
    secondary?: string
} {
    if (!by) return { name: '—' }
    if (typeof by === 'string') return { name: by }
    const composed =
        by.fullName ||
        [by.firstName, by.lastName].filter(Boolean).join(' ').trim() ||
        by.username ||
        by.email ||
        by.sub ||
        by.id ||
        ''
    const secondary =
        by.username && by.username !== composed
            ? by.username
            : by.email && by.email !== composed
              ? by.email
              : undefined
    return { name: composed || '—', secondary }
}

interface AuditPair {
    label: string
    by?: BPMNAuditUser | string
    at?: BPMNDateLike
}

function AuditRow({ label, by, at }: AuditPair): JSX.Element {
    const { name, secondary } = resolveAuditUser(by)
    return (
        <div className="space-y-0.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="text-sm">{name}</div>
            {secondary && <div className="text-xs text-muted-foreground">{secondary}</div>}
            {at && <div className="text-xs text-muted-foreground">{formatDate(at)}</div>}
        </div>
    )
}

export const ProcessCard = ({
    process,
    isSelected,
    onSelectProcess
}: ProcessCardProps): JSX.Element => {
    const hasAudit = Boolean(
        process.createdBy ||
            process.createdDate ||
            process.lastModifiedBy ||
            process.lastModifiedDate
    )

    return (
        <Card
            className={browserCardClassName(
                'cursor-pointer gap-0 py-4',
                isSelected && 'ring-2 ring-emerald-500/50 hover:border-emerald-500/40'
            )}
            onClick={() => {
                onSelectProcess(process)
            }}
        >
            <CardContent className="px-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-base font-medium text-slate-100">
                            {process.title}
                        </CardTitle>
                        <CardDescription className="font-mono text-slate-400">
                            {process.processKey}
                        </CardDescription>
                        {process.deploymentDate && (
                            <div className="mt-2 flex items-center space-x-2 text-sm text-slate-400">
                                <Calendar className="h-4 w-4" />
                                <span>{`Deployed on ${formatDate(process.deploymentDate)}`}</span>
                            </div>
                        )}
                        <div className="mt-1 flex items-center space-x-2 text-sm text-slate-400">
                            <UserCog className="h-4 w-4" />
                            <span>{process.processArtifacts?.length || 0} artifacts</span>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end space-y-2">
                        <div className="flex items-center gap-1">
                            <Badge variant={'outline'} className="border-slate-700 text-slate-300">
                                v{process.version || 'N/A'}
                            </Badge>
                            {hasAudit && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-400 hover:text-slate-100"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Audit info"
                                            aria-label="Audit info"
                                        >
                                            <Info className="h-3.5 w-3.5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        align="end"
                                        side="bottom"
                                        className="w-64 space-y-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="text-xs text-muted-foreground">Audit</div>
                                        <AuditRow
                                            label="Created by"
                                            by={process.createdBy}
                                            at={process.createdDate}
                                        />
                                        <AuditRow
                                            label="Last modified by"
                                            by={process.lastModifiedBy}
                                            at={process.lastModifiedDate}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
