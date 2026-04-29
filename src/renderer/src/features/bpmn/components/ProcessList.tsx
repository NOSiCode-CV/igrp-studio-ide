import {
    IGRPBadgePrimitive,
    IGRPButtonPrimitive,
    IGRPInputPrimitive,
    IGRPSkeletonPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { AlertTriangle, Plug, Plus, RotateCcw, Search, Workflow } from 'lucide-react'
import { type JSX, useMemo } from 'react'
import { cn } from '../../../lib/utils'
import { useProcessStudioClient } from '../client/client-context'
import { useProcessDefinitions, useProjects } from '../hooks/useProcessDefinitions'
import { useProcessesSelection } from './ProcessesSelection'

interface ProcessListProps {
    /**
     * Layout variant.
     * - `panel` (default): compact, fits a 320 px sidebar — used by the
     *   Specification rail's secondary panel.
     * - `full`: spans the available area — used by the UI generator's browser.
     */
    variant?: 'panel' | 'full'
}

export function ProcessList({ variant = 'panel' }: ProcessListProps): JSX.Element {
    const { binding, loading: clientLoading } = useProcessStudioClient()
    const { projectId, processId, search, setProjectId, setProcessId, setSearch } =
        useProcessesSelection()

    const projectsQuery = useProjects()
    const projects = projectsQuery.data ?? []

    // Auto-select first project when none is picked yet.
    const effectiveProjectId =
        projectId ?? (projects.length > 0 ? projects[0].projectId : undefined)

    const processesQuery = useProcessDefinitions(effectiveProjectId)
    const processes = processesQuery.data ?? []

    const filtered = useMemo(() => {
        if (!search.trim()) return processes
        const needle = search.toLowerCase()
        return processes.filter(
            (p) =>
                p.title?.toLowerCase().includes(needle) ||
                p.processKey?.toLowerCase().includes(needle)
        )
    }, [processes, search])

    if (!binding && !clientLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <Plug className="h-8 w-8 text-muted-foreground" />
                <div className="space-y-1">
                    <p className="text-sm font-medium">No active BPMN configuration</p>
                    <p className="text-xs text-muted-foreground">
                        Open the UI Generator → BPMN tab → API Configuration to add
                        and activate a Process API endpoint.
                    </p>
                </div>
            </div>
        )
    }

    const queryError = projectsQuery.error ?? processesQuery.error
    if (queryError) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="max-w-xs text-xs text-muted-foreground">{queryError.message}</p>
                <IGRPButtonPrimitive
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (projectsQuery.error) projectsQuery.refetch()
                        if (processesQuery.error) processesQuery.refetch()
                    }}
                >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Retry
                </IGRPButtonPrimitive>
            </div>
        )
    }

    return (
        <div className={cn('flex flex-col', variant === 'full' ? 'h-full' : 'h-full')}>
            <div className="space-y-2 border-b p-3">
                <select
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    value={effectiveProjectId ?? ''}
                    onChange={(e) => setProjectId(e.target.value || undefined)}
                    disabled={projectsQuery.isLoading || projects.length === 0}
                >
                    {projects.length === 0 && (
                        <option value="">
                            {projectsQuery.isLoading ? 'Loading projects…' : 'No projects'}
                        </option>
                    )}
                    {projects.map((p) => (
                        <option key={p.projectId} value={p.projectId}>
                            {p.name}
                        </option>
                    ))}
                </select>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <IGRPInputPrimitive
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter processes…"
                        className="pl-7"
                    />
                </div>
                <IGRPButtonPrimitive
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                    title="Process creation is part of an upcoming milestone"
                >
                    <Plus className="mr-1 h-4 w-4" />
                    New process
                </IGRPButtonPrimitive>
            </div>
            <div className="flex-1 overflow-y-auto">
                {processesQuery.isLoading ? (
                    <div className="space-y-2 p-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <IGRPSkeletonPrimitive className="mt-0.5 h-4 w-4 rounded" />
                                <div className="flex-1 space-y-1">
                                    <IGRPSkeletonPrimitive className="h-3 w-2/3" />
                                    <IGRPSkeletonPrimitive className="h-2 w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground">
                        {search.trim()
                            ? 'No processes match the filter.'
                            : 'This project has no processes yet.'}
                    </div>
                ) : (
                    <ul className="divide-y">
                        {filtered.map((p) => {
                            const active = p.processDefinitionId === processId
                            return (
                                <li key={p.processDefinitionId}>
                                    <button
                                        type="button"
                                        onClick={() => setProcessId(p.processDefinitionId)}
                                        className={cn(
                                            'flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent',
                                            active && 'bg-accent'
                                        )}
                                    >
                                        <Workflow className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-medium">
                                                {p.title || p.processKey}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="truncate">{p.processKey}</span>
                                                {p.status && (
                                                    <IGRPBadgePrimitive
                                                        variant="outline"
                                                        className="h-4 px-1 text-[10px]"
                                                    >
                                                        {p.statusDesc || p.status}
                                                    </IGRPBadgePrimitive>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}
