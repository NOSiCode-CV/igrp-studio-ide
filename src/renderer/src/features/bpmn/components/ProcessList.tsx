import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { AlertTriangle, Plug, Plus, RotateCcw, Search, Settings, Workflow } from 'lucide-react'
import { type JSX, useMemo, useState } from 'react'
import { cn } from '../../../lib/utils'
import { useProcessStudioClient } from '../client/client-context'
import { useProcessDefinitions, useProjects } from '../hooks/useProcessDefinitions'
import { BPMNConnectionsManager } from './connection/BPMNConnectionsManager'
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
    const [manageOpen, setManageOpen] = useState<boolean>(false)

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

    const manageDialog = (
        <Dialog open={manageOpen} onOpenChange={setManageOpen}>
            <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="border-b px-6 py-4 shrink-0">
                    <DialogTitle>Manage BPMN API connections</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <BPMNConnectionsManager compact />
                </div>
            </DialogContent>
        </Dialog>
    )

    if (!binding && !clientLoading) {
        return (
            <>
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <Plug className="h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium">No active BPMN configuration</p>
                        <p className="text-xs text-muted-foreground">
                            Add a Process API endpoint and activate it to start managing process
                            definitions.
                        </p>
                    </div>
                    <Button size="sm" onClick={() => setManageOpen(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add BPMN connection
                    </Button>
                </div>
                {manageDialog}
            </>
        )
    }

    const queryError = projectsQuery.error ?? processesQuery.error
    if (queryError) {
        return (
            <>
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="max-w-xs text-xs text-muted-foreground">{queryError.message}</p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (projectsQuery.error) projectsQuery.refetch()
                                if (processesQuery.error) processesQuery.refetch()
                            }}
                        >
                            <RotateCcw className="mr-1 h-4 w-4" />
                            Retry
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setManageOpen(true)}>
                            <Settings className="mr-1 h-4 w-4" />
                            Manage connections
                        </Button>
                    </div>
                </div>
                {manageDialog}
            </>
        )
    }

    return (
        <div className={cn('flex flex-col', variant === 'full' ? 'h-full' : 'h-full')}>
            <div className="space-y-2 border-b p-3">
                {binding && (
                    <div
                        className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground"
                        title={binding.config.apiUrl}
                    >
                        <div className="flex min-w-0 items-center gap-1">
                            <Plug className="h-3 w-3 shrink-0" />
                            <span className="truncate">{binding.config.name}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1 text-xs"
                            onClick={() => setManageOpen(true)}
                            title="Manage BPMN connections"
                        >
                            <Settings className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
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
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter processes…"
                        className="pl-7"
                    />
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                    title="Process creation is part of an upcoming milestone"
                >
                    <Plus className="mr-1 h-4 w-4" />
                    New process
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {processesQuery.isLoading ? (
                    <div className="space-y-2 p-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <Skeleton className="mt-0.5 h-4 w-4 rounded" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-3 w-2/3" />
                                    <Skeleton className="h-2 w-1/3" />
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
                                                    <Badge
                                                        variant="outline"
                                                        className="h-4 px-1 text-[10px]"
                                                    >
                                                        {p.statusDesc || p.status}
                                                    </Badge>
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
            {manageDialog}
        </div>
    )
}
