import {
    IGRPBadgePrimitive,
    IGRPButtonPrimitive,
    IGRPCard,
    IGRPCardContent,
    IGRPCardDescription,
    IGRPCardHeader,
    IGRPCardTitle,
    IGRPSelectContentPrimitive,
    IGRPSelectItemPrimitive,
    IGRPSelectPrimitive,
    IGRPSelectTriggerPrimitive,
    IGRPSelectValuePrimitive,
    IGRPToggleGroupItemPrimitive,
    IGRPToggleGroupPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { SearchInput, SubHeadline } from '@renderer/components/shared-ui'
import { useDocker } from '@renderer/hooks/use-docker'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { LayoutGrid, List, Loader2, Play, Server, Square } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ServiceInfo } from 'src/main/types'
import { ConfigurationDialog } from './components/configuration-dialog'
import { ServiceGrid } from './services/service-grid'
import { ServiceList } from './services/service-list'

type ViewMode = 'grid' | 'list'
type StackId = 'main' | 'monitoring' | 'process' | 'project'
type ServiceSubgroupId =
    | 'database'
    | 'web'
    | 'api'
    | 'proxy'
    | 'auth'
    | 'service-discovery'
    | 'cache'
    | 'storage'
    | 'observability'
    | 'messaging'
    | 'other'

interface StackBlock {
    id: StackId
    title: string
    description: string
}

interface ServiceSubgroupBlock {
    id: ServiceSubgroupId
    title: string
}

const stackBlocks: StackBlock[] = [
    { id: 'main', title: 'IGRP Stack', description: 'Core workspace services' },
    { id: 'monitoring', title: 'Monitoring', description: 'Observability services' },
    { id: 'process', title: 'Process', description: 'Process domain services' },
    { id: 'project', title: 'Project', description: 'Project services' }
]

const serviceSubgroupBlocks: ServiceSubgroupBlock[] = [
    { id: 'database', title: 'Database' },
    { id: 'web', title: 'Web' },
    { id: 'api', title: 'API' },
    { id: 'proxy', title: 'Proxy' },
    { id: 'auth', title: 'Auth' },
    { id: 'service-discovery', title: 'Service Discovery' },
    { id: 'cache', title: 'Cache' },
    { id: 'storage', title: 'Storage' },
    { id: 'observability', title: 'Observability' },
    { id: 'messaging', title: 'Messaging' },
    { id: 'other', title: 'Other' }
]

const resolveServiceStack = (service: ServiceInfo): StackId => {
    if (service.labels?.is_project === 'true') {
        return 'project'
    }

    const composeFile = service.composeFile?.toLowerCase() || ''
    if (composeFile.includes('igrp-monitoring-compose.yaml') || composeFile.includes('compose-monitoring.yaml')) {
        return 'monitoring'
    }
    if (composeFile.includes('igrp-process-compose.yaml') || composeFile.includes('compose-process.yaml')) {
        return 'process'
    }
    if (composeFile.includes('igrp-compose.yaml')) {
        return 'main'
    }
    return service.stack ?? 'main'
}

const resolveServiceSubgroup = (service: ServiceInfo): ServiceSubgroupId => {
    const type = (service.labels?.type || '').toLowerCase()
    if (
        type === 'database' ||
        type === 'web' ||
        type === 'api' ||
        type === 'proxy' ||
        type === 'auth' ||
        type === 'service-discovery' ||
        type === 'cache' ||
        type === 'storage' ||
        type === 'observability' ||
        type === 'messaging'
    ) {
        return type
    }
    return 'other'
}

interface WorkspaceServicesProps {
    workspaceId: string
}

export function WorkspaceServices({ workspaceId }: WorkspaceServicesProps): React.JSX.Element {
    const { t } = useTranslation()
    const [serviceViewMode, setServiceViewMode] = useState<ViewMode>('grid')
    const [serviceSearchQuery, setServiceSearchQuery] = useState('')
    const [sortOrderService, setSortOrderService] = useState<string>('lastModified')
    const [runningActionStack, setRunningActionStack] = useState<StackId | null>(null)

    const {
        workspace,
        state: { changeStatus }
    } = useWorkspace()

    const { services, refreshContainers, restartService, stopService, startContainers } = useDocker({
        workspace: workspace!,
        changeStatus
    })

    useEffect(() => {
        void refreshContainers()
    }, [workspaceId])

    const allServices = useMemo(() => {
        return services
    }, [services])

    const filteredServices = useMemo(() => {
        if (!serviceSearchQuery.trim()) return allServices
        const query = serviceSearchQuery.toLowerCase()
        return allServices.filter(
            (service) =>
                service.container_name?.toLowerCase().includes(query) ||
                service.name?.toLowerCase().includes(query) ||
                service.labels?.type?.toLowerCase().includes(query)
        )
    }, [allServices, serviceSearchQuery])

    const stackServices = useMemo(() => {
        const grouped: Record<StackId, ServiceInfo[]> = {
            main: [],
            monitoring: [],
            process: [],
            project: []
        }
        for (const service of allServices) {
            const stack = resolveServiceStack(service)
            grouped[stack].push(service)
        }
        return grouped
    }, [allServices])

    const groupedFilteredServices = useMemo(() => {
        const grouped: Record<StackId, ServiceInfo[]> = {
            main: [],
            monitoring: [],
            process: [],
            project: []
        }
        for (const service of filteredServices) {
            grouped[resolveServiceStack(service)].push(service)
        }
        return grouped
    }, [filteredServices])

    const handleStartStack = async (stackId: StackId): Promise<void> => {
        const names = stackServices[stackId].map((service) => service.name)
        if (!names.length) return
        setRunningActionStack(stackId)
        try {
            try {
                await restartService(names)
            } catch {
                await startContainers()
            }
            await refreshContainers()
        } finally {
            setRunningActionStack(null)
        }
    }

    const handleStopStack = async (stackId: StackId): Promise<void> => {
        const names = stackServices[stackId].map((service) => service.name)
        if (!names.length) return
        setRunningActionStack(stackId)
        try {
            await stopService(names)
            await refreshContainers()
        } finally {
            setRunningActionStack(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <SubHeadline
                        icon={Server}
                        title={t('services')}
                        description={`${filteredServices.length} services`}
                    />
                    <ConfigurationDialog services={allServices} isNew={true}>
                        <IGRPButtonPrimitive>{t('newService')}</IGRPButtonPrimitive>
                    </ConfigurationDialog>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <SearchInput
                            placeholder={`${t('search')} services...`}
                            value={serviceSearchQuery}
                            onChange={setServiceSearchQuery}
                            className="lg:w-[250px]"
                        />
                        <IGRPToggleGroupPrimitive
                            type="single"
                            value={serviceViewMode}
                            onValueChange={(value) =>
                                value && setServiceViewMode(value as ViewMode)
                            }
                        >
                            <IGRPToggleGroupItemPrimitive value="grid" size="sm" className="h-8 w-8">
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </IGRPToggleGroupItemPrimitive>
                            <IGRPToggleGroupItemPrimitive value="list" size="sm" className="h-8 w-8">
                                <List className="h-3.5 w-3.5" />
                            </IGRPToggleGroupItemPrimitive>
                        </IGRPToggleGroupPrimitive>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>{t('sortBy')}</span>
                        <IGRPSelectPrimitive value={sortOrderService} onValueChange={setSortOrderService}>
                            <IGRPSelectTriggerPrimitive className="w-[180px] !h-7">
                                <IGRPSelectValuePrimitive placeholder={t('orderBy')} />
                            </IGRPSelectTriggerPrimitive>
                            <IGRPSelectContentPrimitive>
                                <IGRPSelectItemPrimitive value="lastModified">
                                    {t('lastModified')}
                                </IGRPSelectItemPrimitive>
                                <IGRPSelectItemPrimitive value="name">{t('name')}</IGRPSelectItemPrimitive>
                                <IGRPSelectItemPrimitive value="type">{t('type')}</IGRPSelectItemPrimitive>
                            </IGRPSelectContentPrimitive>
                        </IGRPSelectPrimitive>
                    </div>
                </div>
                <div className="space-y-6">
                    {stackBlocks.map((stack) => {
                        const stackItems = groupedFilteredServices[stack.id]
                        const currentServices = stackServices[stack.id]
                        const subgroupedStackItems: Record<ServiceSubgroupId, ServiceInfo[]> = {
                            database: [],
                            web: [],
                            api: [],
                            proxy: [],
                            auth: [],
                            'service-discovery': [],
                            cache: [],
                            storage: [],
                            observability: [],
                            messaging: [],
                            other: []
                        }
                        for (const service of stackItems) {
                            subgroupedStackItems[resolveServiceSubgroup(service)].push(service)
                        }
                        const running = currentServices.filter((service) => service.status === 'running')
                        const isBusy = runningActionStack === stack.id

                        return (
                            <IGRPCard
                                key={`group-${stack.id}`}
                                className="border-2 border-primary/30 bg-white shadow-sm"
                            >
                                <IGRPCardHeader className="compact-card-header bg-white border-b">
                                    <IGRPCardTitle className="text-sm flex items-center justify-between">
                                        <span>{stack.title}</span>
                                        <IGRPBadgePrimitive variant="outline" className="text-xs">
                                            {running.length}/{currentServices.length}
                                        </IGRPBadgePrimitive>
                                    </IGRPCardTitle>
                                    <IGRPCardDescription className="text-xs">
                                        {stack.description}
                                    </IGRPCardDescription>
                                </IGRPCardHeader>
                                <IGRPCardContent className="compact-card-content space-y-3">
                                    <div className="flex gap-2">
                                        <IGRPButtonPrimitive
                                            size="sm"
                                            variant="outline"
                                            className="h-7"
                                            onClick={() => void handleStartStack(stack.id)}
                                            disabled={isBusy || currentServices.length === 0}
                                        >
                                            {isBusy ? (
                                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                            ) : (
                                                <Play className="h-3.5 w-3.5 mr-1" />
                                            )}
                                            Start
                                        </IGRPButtonPrimitive>
                                        <IGRPButtonPrimitive
                                            size="sm"
                                            variant="outline"
                                            className="h-7"
                                            onClick={() => void handleStopStack(stack.id)}
                                            disabled={isBusy || currentServices.length === 0}
                                        >
                                            <Square className="h-3.5 w-3.5 mr-1" />
                                            Stop
                                        </IGRPButtonPrimitive>
                                        <IGRPBadgePrimitive variant="outline" className="text-xs ml-auto">
                                            {stackItems.length} shown
                                        </IGRPBadgePrimitive>
                                    </div>

                                    {stackItems.length === 0 ? (
                                        <div className="text-xs text-muted-foreground border rounded-md p-3">
                                            No services in this group for the current filter.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {serviceSubgroupBlocks.map((subgroup) => {
                                                const subgroupItems = subgroupedStackItems[subgroup.id]
                                                if (!subgroupItems.length) return null
                                                return (
                                                    <div
                                                        key={`${stack.id}-${subgroup.id}`}
                                                        className="space-y-2 rounded-md border border-border/60 bg-white p-3"
                                                    >
                                                        <div className="flex items-center justify-between border-b pb-1.5">
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                                                {subgroup.title}
                                                            </div>
                                                            <IGRPBadgePrimitive
                                                                variant="outline"
                                                                className="text-[10px]"
                                                            >
                                                                {subgroupItems.length}
                                                            </IGRPBadgePrimitive>
                                                        </div>
                                                        {serviceViewMode === 'grid' ? (
                                                            <ServiceGrid
                                                                services={subgroupItems}
                                                                workspaceId={workspaceId}
                                                                showFilter={false}
                                                            />
                                                        ) : (
                                                            <ServiceList
                                                                services={subgroupItems}
                                                                workspaceId={workspaceId}
                                                                showFilter={false}
                                                            />
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </IGRPCardContent>
                            </IGRPCard>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
