import {
    IGRPBadgePrimitive,
    IGRPButtonPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive,
    IGRPPopoverContentPrimitive,
    IGRPPopoverPrimitive,
    IGRPPopoverTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Calendar, Info, UserCog } from 'lucide-react'
import type { JSX } from 'react/jsx-runtime'
import type { BPMNAuditUser, BPMNProjectProcessDefinition } from 'src/main/types'

interface ProcessCardProps {
    process: BPMNProjectProcessDefinition
    isSelected: boolean
    onSelectProcess: (process: BPMNProjectProcessDefinition) => void
}

function formatDate(value?: string): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
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
function resolveAuditUser(
    by: BPMNAuditUser | string | undefined
): { name: string; secondary?: string } {
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
    at?: string
}

function AuditRow({ label, by, at }: AuditPair): JSX.Element {
    const { name, secondary } = resolveAuditUser(by)
    return (
        <div className="space-y-0.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="text-sm">{name}</div>
            {secondary && (
                <div className="text-xs text-muted-foreground">{secondary}</div>
            )}
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
        <IGRPCardPrimitive
            className={`hover:shadow-md transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-primary ' : 'hover:bg-muted/30'
            }`}
            onClick={() => {
                onSelectProcess(process)
            }}
        >
            <IGRPCardContentPrimitive>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <IGRPCardTitlePrimitive className="text-base font-medium">
                            {process.title}
                        </IGRPCardTitlePrimitive>
                        <IGRPCardDescriptionPrimitive>
                            {process.processKey}
                        </IGRPCardDescriptionPrimitive>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {process.deploymentDate && (
                                <span>
                                    {`Deployed on ${process.deploymentDate ? process.deploymentDate : 'N/A'}`}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                            <UserCog className="w-4 h-4" />
                            <span>{process.processArtifacts?.length || 0} artifacts</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2 shrink-0">
                        <div className="flex items-center gap-1">
                            <IGRPBadgePrimitive variant={'outline'}>
                                v{process.version || 'N/A'}
                            </IGRPBadgePrimitive>
                            {hasAudit && (
                                <IGRPPopoverPrimitive>
                                    <IGRPPopoverTriggerPrimitive asChild>
                                        <IGRPButtonPrimitive
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Audit info"
                                            aria-label="Audit info"
                                        >
                                            <Info className="h-3.5 w-3.5" />
                                        </IGRPButtonPrimitive>
                                    </IGRPPopoverTriggerPrimitive>
                                    <IGRPPopoverContentPrimitive
                                        align="end"
                                        side="bottom"
                                        className="w-64 space-y-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="text-xs text-muted-foreground">
                                            Audit
                                        </div>
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
                                    </IGRPPopoverContentPrimitive>
                                </IGRPPopoverPrimitive>
                            )}
                        </div>
                    </div>
                </div>
            </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
    )
}
