import { Button } from '@renderer/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@renderer/components/ui/toggle-group'
import { SearchInput } from '@renderer/components/shared-ui'
import { useDocker } from '@renderer/hooks/use-docker'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import {
    Check,
    Container,
    LayoutDashboard,
    LayoutGrid,
    ListFilter,
    Network,
    Play,
    Plus,
    Server,
    StretchHorizontal,
    Square
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ServiceInfo } from 'src/main/types'
import { ConfigurationDialog } from './components/configuration-dialog'
import { DependencyDiagram } from './services/dependency-diagram'
import { resolveServiceVisualType } from './services'
import { ServiceGrid } from './services/service-grid'
import { SERVICE_LIST_GRID, ServiceList } from './services/service-list'
import { WorkspaceDocker } from './views/workspace-docker'

type ViewMode = 'grid' | 'list'
type StackId = 'main' | 'monitoring' | 'process' | 'project'
type ServicesPanelTab = 'overview' | 'diagram' | 'docker'

interface StackBlock {
    id: StackId
    title: string
    description: string
}

const stackBlocks: StackBlock[] = [
    { id: 'main', title: 'IGRP Stack', description: 'Core workspace services' },
    { id: 'monitoring', title: 'Monitoring', description: 'Observability services' },
    { id: 'process', title: 'Process', description: 'Process engine services' },
    { id: 'project', title: 'Project', description: 'Project-level services' }
]

const ALL_FILTER_VALUE = 'all'

const resolveServiceStack = (service: ServiceInfo): StackId => {
    if (service.labels?.is_project === 'true') {
        return 'project'
    }

    const composeFile = service.composeFile?.toLowerCase() || ''
    if (
        composeFile.includes('igrp-monitoring-compose.yaml') ||
        composeFile.includes('compose-monitoring.yaml')
    ) {
        return 'monitoring'
    }
    if (
        composeFile.includes('igrp-process-compose.yaml') ||
        composeFile.includes('compose-process.yaml')
    ) {
        return 'process'
    }
    if (composeFile.includes('igrp-compose.yaml')) {
        return 'main'
    }
    return service.stack ?? 'main'
}

const resolveServiceStatusFilterKey = (service: ServiceInfo): string => {
    const status = (service.status || '').toLowerCase()
    if (status === 'running') return 'running'
    if (status === 'error') return 'error'
    if (
        status === 'stopped' ||
        status === 'exited' ||
        status === 'dead' ||
        status === 'created' ||
        status === 'removing'
    ) {
        return 'stopped'
    }
    return status || 'other'
}

const resolveServiceTypeKey = (service: ServiceInfo): string => {
    return resolveServiceVisualType(service)
}

const toLabel = (value: string): string => {
    if (!value) return ''
    return value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

interface WorkspaceServicesProps {
    workspaceId: string
}

const servicesPanelTabs: Array<{
    id: ServicesPanelTab
    labelKey: 'overview' | 'diagram' | 'docker'
    icon: typeof LayoutDashboard
}> = [
    { id: 'overview', labelKey: 'overview', icon: LayoutDashboard },
    { id: 'diagram', labelKey: 'diagram', icon: Network },
    { id: 'docker', labelKey: 'docker', icon: Container }
]

export function WorkspaceServices({ workspaceId }: WorkspaceServicesProps): React.JSX.Element {
    const { t } = useTranslation()
    const [serviceViewMode, setServiceViewMode] = useState<ViewMode>('grid')
    const [serviceSearchQuery, setServiceSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER_VALUE)
    const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER_VALUE)
    const [typeFilter, setTypeFilter] = useState<string>(ALL_FILTER_VALUE)
    const [activePanelTab, setActivePanelTab] = useState<ServicesPanelTab>('overview')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [stackActionState, setStackActionState] = useState<{
        stackId: StackId | null
        action: 'start' | 'stop' | null
    }>({ stackId: null, action: null })

    const {
        workspace,
        state: { changeStatus }
    } = useWorkspace()

    const { services, refreshContainers, restartService, stopService, startContainers } = useDocker({
        workspace: workspace!,
        changeStatus
    })

    useEffect(() => {
        // Intentionally keyed only by workspaceId to avoid render loops:
        // `refreshContainers` is not referentially stable across renders.
        void refreshContainers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId])

    const allServices = useMemo(() => services, [services])

    const availableTypeFilters = useMemo(() => {
        const types = new Set<string>()
        for (const service of allServices) {
            const value = resolveServiceTypeKey(service)
            if (value && value !== ALL_FILTER_VALUE) types.add(value)
        }
        return Array.from(types).sort((a, b) => a.localeCompare(b))
    }, [allServices])

    const availableStatusFilters = useMemo(() => {
        const statuses = new Set<string>()
        for (const service of allServices) {
            const value = resolveServiceStatusFilterKey(service)
            if (value && value !== ALL_FILTER_VALUE) statuses.add(value)
        }
        const priority = ['running', 'stopped', 'error']
        return Array.from(statuses).sort((a, b) => {
            const ia = priority.indexOf(a)
            const ib = priority.indexOf(b)
            if (ia >= 0 && ib >= 0) return ia - ib
            if (ia >= 0) return -1
            if (ib >= 0) return 1
            return a.localeCompare(b)
        })
    }, [allServices])

    const filteredServices = useMemo(() => {
        const query = serviceSearchQuery.toLowerCase().trim()
        return allServices.filter((service) => {
            const matchesSearch =
                !query ||
                service.container_name?.toLowerCase().includes(query) ||
                service.name?.toLowerCase().includes(query) ||
                service.labels?.type?.toLowerCase().includes(query)

            const matchesCategory =
                categoryFilter === ALL_FILTER_VALUE ||
                resolveServiceStack(service) === categoryFilter

            const matchesStatus =
                statusFilter === ALL_FILTER_VALUE ||
                resolveServiceStatusFilterKey(service) === statusFilter

            const matchesType =
                typeFilter === ALL_FILTER_VALUE ||
                resolveServiceTypeKey(service) === typeFilter

            return matchesSearch && matchesCategory && matchesStatus && matchesType
        })
    }, [allServices, categoryFilter, serviceSearchQuery, statusFilter, typeFilter])

    useEffect(() => {
        if (statusFilter !== ALL_FILTER_VALUE && !availableStatusFilters.includes(statusFilter)) {
            setStatusFilter(ALL_FILTER_VALUE)
        }
    }, [availableStatusFilters, statusFilter])

    useEffect(() => {
        if (typeFilter !== ALL_FILTER_VALUE && !availableTypeFilters.includes(typeFilter)) {
            setTypeFilter(ALL_FILTER_VALUE)
        }
    }, [availableTypeFilters, typeFilter])

    const servicesCountLabel = `${allServices.length} ${t('services').toUpperCase()}`
    const activeFiltersCount = [categoryFilter, statusFilter, typeFilter].filter(
        (value) => value !== ALL_FILTER_VALUE
    ).length

    const categoryOptions = useMemo(
        () => [
            { value: ALL_FILTER_VALUE, label: t('allCategories') },
            ...stackBlocks.map((stack) => ({ value: stack.id, label: stack.title }))
        ],
        [t]
    )

    const statusOptions = useMemo(
        () => [
            { value: ALL_FILTER_VALUE, label: t('all') },
            ...availableStatusFilters.map((status) => ({ value: status, label: toLabel(status) }))
        ],
        [availableStatusFilters, t]
    )

    const typeOptions = useMemo(
        () => [
            { value: ALL_FILTER_VALUE, label: t('allTypes') },
            ...availableTypeFilters.map((type) => ({ value: type, label: toLabel(type) }))
        ],
        [availableTypeFilters, t]
    )

    const handleStackAction = async (
        stackId: StackId,
        action: 'start' | 'stop',
        serviceNames: string[]
    ): Promise<void> => {
        if (serviceNames.length === 0) return

        setStackActionState({ stackId, action })
        try {
            if (action === 'start') {
                await restartService(serviceNames, 300)
            } else {
                await stopService(serviceNames)
            }
            await refreshContainers()
        } finally {
            setStackActionState({ stackId: null, action: null })
        }
    }

    const groupedOverview = useMemo(() => {
        return stackBlocks
            .map((stack) => {
                const allStackServices = allServices.filter(
                    (service) => resolveServiceStack(service) === stack.id
                )
                const stackServices = filteredServices.filter(
                    (service) => resolveServiceStack(service) === stack.id
                )
                const totalInStack = allStackServices.length
                const runningInStack = allStackServices.filter(
                    (service) => resolveServiceStatusFilterKey(service) === 'running'
                ).length
                const stackServiceNames = allStackServices
                    .map((service) => service.name)
                    .filter((name): name is string => Boolean(name))

                const byType = new Map<string, ServiceInfo[]>()
                for (const service of stackServices) {
                    const typeKey = resolveServiceTypeKey(service)
                    const current = byType.get(typeKey) || []
                    current.push(service)
                    byType.set(typeKey, current)
                }

                const typeGroups = Array.from(byType.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([type, services]) => ({ type, services }))

                return {
                    stack,
                    totalInStack,
                    runningInStack,
                    visibleInStack: stackServices.length,
                    stackServiceNames,
                    typeGroups
                }
            })
            .filter((group) => group.visibleInStack > 0)
    }, [allServices, filteredServices])

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="z-20 shrink-0 bg-white dark:bg-slate-950">
                <div className="flex min-h-[58px] items-center justify-between gap-4 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-teal-600" strokeWidth={1.8} />
                        <h2 className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">{t('services')}</h2>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            {servicesCountLabel}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {activePanelTab === 'overview' && (
                            <>
                                <SearchInput
                                    placeholder={`${t('search')}...`}
                                    value={serviceSearchQuery}
                                    onChange={setServiceSearchQuery}
                                    className="w-[226px]"
                                    inputClassName="h-8 border-slate-200 bg-white text-xs text-slate-600 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                                    iconClassName="text-slate-400 dark:text-slate-500"
                                />
                                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`relative h-[30px] w-[30px] rounded-md border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 ${
                                                isFilterOpen
                                                    ? 'bg-slate-100 text-teal-600 dark:bg-slate-800 dark:text-teal-400'
                                                    : 'bg-white text-slate-400 dark:bg-slate-900 dark:text-slate-500'
                                            }`}
                                        >
                                            <ListFilter className="h-4 w-4" />
                                            {activeFiltersCount > 0 && (
                                                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0d9488] px-1 text-[10px] font-semibold text-white">
                                                    {activeFiltersCount}
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        align="end"
                                        className="w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <div className="space-y-3">
                                            <div>
                                                <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                                                    {t('category')}
                                                </div>
                                                <div className="space-y-1">
                                                    {categoryOptions.map((option) => {
                                                        const selected = categoryFilter === option.value
                                                        return (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setCategoryFilter(option.value)}
                                                                className={`flex h-8 w-full items-center justify-between rounded-md px-2.5 text-xs transition-colors ${
                                                                    selected
                                                                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                                                }`}
                                                            >
                                                                <span>{option.label}</span>
                                                                {selected && (
                                                                    <Check className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                            <div>
                                                <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                                                    {t('status')}
                                                </div>
                                                <div className="space-y-1">
                                                    {statusOptions.map((option) => {
                                                        const selected = statusFilter === option.value
                                                        return (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setStatusFilter(option.value)}
                                                                className={`flex h-8 w-full items-center justify-between rounded-md px-2.5 text-xs transition-colors ${
                                                                    selected
                                                                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                                                }`}
                                                            >
                                                                <span>{option.label}</span>
                                                                {selected && (
                                                                    <Check className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                            <div>
                                                <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                                                    {t('type')}
                                                </div>
                                                <div className="max-h-[150px] space-y-1 overflow-y-auto pr-1">
                                                    {typeOptions.map((option) => {
                                                        const selected = typeFilter === option.value
                                                        return (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setTypeFilter(option.value)}
                                                                className={`flex h-8 w-full items-center justify-between rounded-md px-2.5 text-xs transition-colors ${
                                                                    selected
                                                                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                                                }`}
                                                            >
                                                                <span>{option.label}</span>
                                                                {selected && (
                                                                    <Check className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <ToggleGroup
                                    type="single"
                                    value={serviceViewMode}
                                    onValueChange={(value) =>
                                        value && setServiceViewMode(value as ViewMode)
                                    }
                                    className="hidden rounded-md border border-slate-200 bg-slate-100 md:flex dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <ToggleGroupItem
                                        value="grid"
                                        size="sm"
                                        className="h-8 w-8 rounded-sm px-0 text-slate-400 data-[state=on]:bg-white data-[state=on]:text-teal-600 data-[state=on]:shadow-sm dark:text-slate-500 dark:data-[state=on]:bg-slate-800 dark:data-[state=on]:text-teal-300"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="list"
                                        size="sm"
                                        className="h-8 w-8 rounded-sm px-0 text-slate-400 data-[state=on]:bg-white data-[state=on]:text-teal-600 data-[state=on]:shadow-sm dark:text-slate-500 dark:data-[state=on]:bg-slate-800 dark:data-[state=on]:text-teal-300"
                                    >
                                        <StretchHorizontal className="h-3.5 w-3.5" />
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </>
                        )}

                        <ConfigurationDialog services={allServices} isNew={true}>
                            <Button className="h-[30px] rounded-md border border-[#0d9488] !bg-[#0d9488] px-2.5 font-semibold !text-white hover:border-[#0f766e] hover:!bg-[#0f766e]">
                                <Plus className="mr-1 h-3.5 w-3.5 text-white" />
                                {t('newService')}
                            </Button>
                        </ConfigurationDialog>
                    </div>
                </div>

                <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950">
                    {servicesPanelTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activePanelTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActivePanelTab(tab.id)}
                                className={`inline-flex h-11 items-center gap-1.5 border-b-2 px-2 text-sm transition-colors ${
                                    isActive
                                        ? 'border-b-teal-600 text-slate-900 dark:text-slate-100'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {t(tab.labelKey)}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                {activePanelTab === 'diagram' && workspace && (
                    <div className="h-full overflow-y-auto p-4">
                        <DependencyDiagram
                            services={filteredServices}
                            onStart={async (serviceName) => {
                                try {
                                    await restartService([serviceName], 300)
                                } catch {
                                    await startContainers()
                                }
                                await refreshContainers()
                            }}
                            onStop={async (serviceName) => {
                                await stopService([serviceName])
                                await refreshContainers()
                            }}
                            onRestart={async (serviceName) => {
                                await restartService([serviceName])
                                await refreshContainers()
                            }}
                            onRefresh={async () => {
                                await refreshContainers()
                            }}
                        />
                    </div>
                )}

                {activePanelTab === 'docker' && workspace && (
                    <div className="h-full overflow-y-auto p-4">
                        <WorkspaceDocker workspace={workspace} onStacksChanged={refreshContainers} />
                    </div>
                )}

                {activePanelTab === 'overview' && (
                    <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin p-4">
                        {groupedOverview.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/30 p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-500">
                                {t('noServicesFound')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {serviceViewMode === 'list' ? (
                                    <div className="sticky top-0 z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                        <div
                                            className="grid items-center gap-3 border-b border-slate-200 bg-slate-50/90 p-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400"
                                            style={{ gridTemplateColumns: SERVICE_LIST_GRID }}
                                        >
                                            <div>{t('name')}</div>
                                            <div>{t('ports')}</div>
                                            <div>{t('dependencies')}</div>
                                            <div className="w-[80px]">{t('status')}</div>
                                            <div className="w-[36px]" />
                                        </div>
                                    </div>
                                ) : null}

                                {groupedOverview.map((group) => (
                                    <section key={group.stack.id} className="bg-white dark:bg-slate-950">
                                        <div
                                            className={`sticky z-10 flex min-h-11 items-center justify-between border-b border-[#e5edf5] bg-white px-4 dark:border-slate-800 dark:bg-slate-950 ${
                                                serviceViewMode === 'list' ? 'top-[43px]' : 'top-2'
                                            }`}
                                        >
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1f2b3d] dark:text-slate-200">
                                                        {group.stack.title}
                                                    </h3>
                                                    <span className="inline-flex h-6 items-center rounded-md border border-teal-200 bg-teal-50 px-2 text-xs font-semibold text-teal-700 dark:border-teal-800/70 dark:bg-teal-900/30 dark:text-teal-300">
                                                        {group.runningInStack}/{group.totalInStack}
                                                    </span>
                                                    <span className="text-xs text-[#8aa0bb] dark:text-slate-400">
                                                        {group.stack.description}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            void handleStackAction(
                                                                group.stack.id,
                                                                'start',
                                                                group.stackServiceNames
                                                            )
                                                        }
                                                        disabled={
                                                            stackActionState.stackId ===
                                                                group.stack.id &&
                                                            stackActionState.action !== null
                                                        }
                                                        className="h-7 w-7 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                                                    >
                                                        <Play className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            void handleStackAction(
                                                                group.stack.id,
                                                                'stop',
                                                                group.stackServiceNames
                                                            )
                                                        }
                                                        disabled={
                                                            stackActionState.stackId ===
                                                                group.stack.id &&
                                                            stackActionState.action !== null
                                                        }
                                                        className="h-7 w-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                                                    >
                                                        <Square className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                        </div>

                                        <div className="space-y-4 p-4">
                                            {group.typeGroups.map((typeGroup) => (
                                                <div key={`${group.stack.id}-${typeGroup.type}`} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-[#b8c5d8] dark:bg-slate-600" />
                                                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8aa0bb] dark:text-slate-400">
                                                            {toLabel(typeGroup.type)}
                                                        </span>
                                                        <span className="text-xs text-[#a4b3c5] dark:text-slate-500">
                                                            ({typeGroup.services.length})
                                                        </span>
                                                    </div>

                                                    {serviceViewMode === 'grid' ? (
                                                        <ServiceGrid
                                                            services={typeGroup.services}
                                                            workspaceId={workspaceId}
                                                            showFilter={false}
                                                            onActionComplete={refreshContainers}
                                                        />
                                                    ) : (
                                                        <ServiceList
                                                            services={typeGroup.services}
                                                            workspaceId={workspaceId}
                                                            showFilter={false}
                                                            showHeader={serviceViewMode !== 'list'}
                                                            onActionComplete={refreshContainers}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
