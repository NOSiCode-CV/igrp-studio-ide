import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    BaseEdge,
    ConnectionLineType,
    type Edge,
    type EdgeProps,
    type EdgeTypes,
    Handle,
    MarkerType,
    type Node,
    type NodeTypes,
    Panel,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    useEdgesState,
    useNodesState
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import { useDocker } from '@renderer/hooks/use-docker'
import { cn } from '@renderer/lib/utils'
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Compass,
    Container,
    Database,
    Globe,
    HardDrive,
    Layers,
    Network,
    Play,
    Plus,
    RefreshCw,
    Server,
    Shield,
    Square,
    Stethoscope,
    Workflow
} from 'lucide-react'
import type { IWorkspace, ServiceInfo } from 'src/main/types'
import { ConfigurationDialog } from '../components/configuration-dialog'

// Custom Node Components
// `@xyflow/react` v12 requires Node data to satisfy `Record<string, unknown>`.
type ServiceNodeData = {
    service: ServiceInfo
    serviceUrl?: string | null
    isMuted?: boolean
    isRelated?: boolean
    onAction: (action: string, serviceName: string) => void
    services: ServiceInfo[]
    onEditService: (service: ServiceInfo) => void
    onDeleteService: (service: ServiceInfo) => void
    onOpenInBrowser: (service: ServiceInfo) => void
} & Record<string, unknown>

type GroupLabelNodeData = {
    label: string
    colorClass: string
} & Record<string, unknown>

type DiagramNode = Node<ServiceNodeData> | Node<GroupLabelNodeData>
type DiagramEdgeData = {
    related?: boolean
    sourceRunning?: boolean
}

type DiagramServiceStatus =
    | 'healthy'
    | 'running'
    | 'starting'
    | 'unhealthy'
    | 'stopped'
    | 'exited'
    | 'error'
    | 'unknown'

type DiagramStackId = 'main' | 'monitoring' | 'process' | 'project'

type DiagramServiceType =
    | 'database'
    | 'web'
    | 'proxy'
    | 'auth'
    | 'service-discovery'
    | 'cache'
    | 'storage'
    | 'observability'
    | 'other'

const resolveDiagramStatus = (service?: ServiceInfo): DiagramServiceStatus => {
    if (!service) return 'unknown'
    const status = (service.status || '').toLowerCase()
    const statusMessage = (service.statusMessage || '').toLowerCase()

    if (status === 'running') {
        if (statusMessage.includes('unhealthy')) return 'unhealthy'
        if (statusMessage.includes('health: starting') || statusMessage.includes('starting')) {
            return 'starting'
        }
        if (statusMessage.includes('healthy')) return 'healthy'
        return 'running'
    }

    if (status === 'exited') return 'exited'
    if (status === 'error') return 'error'
    if (
        status === 'stopped' ||
        status === 'created' ||
        status === 'dead' ||
        status === 'removing'
    ) {
        return 'stopped'
    }
    return 'unknown'
}

const resolveDiagramStack = (service?: ServiceInfo): DiagramStackId => {
    if (!service) return 'main'
    if (service.labels?.is_project === 'true') return 'project'
    const composeFile = (service.composeFile || '').toLowerCase()
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
    if (
        composeFile.includes('igrp-projects-compose.yml') ||
        composeFile.includes('igrp-projects-compose.yaml')
    ) {
        return 'project'
    }
    return (service.stack as DiagramStackId) || 'main'
}

const resolveDiagramServiceType = (service: ServiceInfo): DiagramServiceType => {
    const explicitType = (service.labels?.type || '').toLowerCase().trim()
    if (
        explicitType === 'database' ||
        explicitType === 'web' ||
        explicitType === 'proxy' ||
        explicitType === 'auth' ||
        explicitType === 'service-discovery' ||
        explicitType === 'cache' ||
        explicitType === 'storage' ||
        explicitType === 'observability'
    ) {
        return explicitType
    }

    const fingerprint = `${service.name || ''} ${service.container_name || ''} ${service.image || ''}`.toLowerCase()
    if (fingerprint.includes('db') || fingerprint.includes('postgres') || fingerprint.includes('mysql')) {
        return 'database'
    }
    if (fingerprint.includes('proxy') || fingerprint.includes('gateway') || fingerprint.includes('nginx')) {
        return 'proxy'
    }
    if (fingerprint.includes('keycloak') || fingerprint.includes('auth')) {
        return 'auth'
    }
    if (fingerprint.includes('eureka') || fingerprint.includes('discovery')) {
        return 'service-discovery'
    }
    if (fingerprint.includes('redis') || fingerprint.includes('cache')) {
        return 'cache'
    }
    if (fingerprint.includes('minio') || fingerprint.includes('storage')) {
        return 'storage'
    }
    if (
        fingerprint.includes('prometheus') ||
        fingerprint.includes('grafana') ||
        fingerprint.includes('tempo') ||
        fingerprint.includes('loki') ||
        fingerprint.includes('otel') ||
        fingerprint.includes('opentelemetry')
    ) {
        return 'observability'
    }
    if (fingerprint.includes('web') || fingerprint.includes('frontend') || fingerprint.includes('api')) {
        return 'web'
    }
    return 'other'
}

const TYPE_BG: Record<DiagramServiceType, string> = {
    database: 'bg-amber-500',
    web: 'bg-blue-500',
    proxy: 'bg-teal-500',
    auth: 'bg-red-500',
    'service-discovery': 'bg-indigo-500',
    cache: 'bg-purple-500',
    storage: 'bg-orange-500',
    observability: 'bg-fuchsia-500',
    other: 'bg-slate-400'
}

const TypeIcon: Record<DiagramServiceType, React.ComponentType<{ className?: string }>> = {
    database: Database,
    web: Globe,
    proxy: Workflow,
    auth: Shield,
    'service-discovery': Compass,
    cache: Server,
    storage: HardDrive,
    observability: Stethoscope,
    other: Layers
}

const ServiceNode: React.FC<{
    data: ServiceNodeData
    selected: boolean
}> = ({ data, selected }) => {
    const { service, isMuted, isRelated, onAction } = data
    const status = resolveDiagramStatus(service)
    const isRunning = status === 'healthy' || status === 'running'
    const isError = status === 'unhealthy' || status === 'error'
    const statusColor = isRunning ? '#4DB33D' : isError ? '#EC1111' : '#999999'
    const statusLabel = (service.status || status).toUpperCase()
    const serviceType = resolveDiagramServiceType(service)
    const ServiceTypeIcon = TypeIcon[serviceType]
    const typeBg = TYPE_BG[serviceType]
    const portsLabel = service.ports?.length ? service.ports.join(', ') : 'none'
    const isHighlighted = selected || Boolean(isRelated)
    const serviceTypeLabel = serviceType.replace('-', ' ')

    return (
        <div
            className={cn(
                'relative w-[272px] overflow-hidden rounded-lg border bg-white font-mono shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-all duration-200',
                isHighlighted
                    ? 'border-[#0ea5e9] shadow-[0_0_0_1px_rgba(14,165,233,0.35),0_8px_22px_rgba(14,165,233,0.18)]'
                    : 'border-slate-200',
                isMuted ? 'opacity-35 saturate-50' : 'opacity-100'
            )}
        >
            <Handle
                type="source"
                position={Position.Right}
                id="source"
                style={{
                    background: 'transparent',
                    border: 0,
                    width: 8,
                    height: 8
                }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="target"
                style={{
                    background: 'transparent',
                    border: 0,
                    width: 8,
                    height: 8
                }}
            />

            <div
                className={cn(
                    'flex h-9 items-center justify-between border-b border-slate-200 px-3'
                )}
            >
                <div className="flex min-w-0 items-center gap-2">
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded text-white', typeBg)}>
                        <ServiceTypeIcon className="h-3 w-3" />
                    </span>
                    <span className="truncate text-[11px] font-semibold text-slate-800">
                        {service.name}
                    </span>
                </div>
                <span
                    className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        isRunning && 'animate-pulse shadow-[0_0_0_4px_rgba(77,179,61,0.18)]'
                    )}
                    style={{ backgroundColor: statusColor }}
                />
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 pt-2">
                <div className="truncate text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {serviceTypeLabel}
                </div>
                <div className="truncate text-[10px] font-semibold text-slate-500">{portsLabel}</div>
            </div>

            <div className="truncate px-3 pb-2 pt-1 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2">
                    image:
                </span>{' '}
                {service.image || 'none'}
            </div>

            <div className="flex h-8 items-center justify-between border-t border-slate-200 px-3">
                <span
                    className={cn(
                        'truncate text-[10px] font-semibold uppercase tracking-[0.12em]',
                        isRunning && 'text-[#2ea043]',
                        isError && 'text-[#EC1111]',
                        !isRunning && !isError && 'text-slate-400'
                    )}
                >
                    {statusLabel}
                </span>
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-30"
                        onClick={() => onAction('start', service.name)}
                        disabled={service.status === 'running'}
                    >
                        <Play className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-30"
                        onClick={() => onAction('stop', service.name)}
                        disabled={service.status !== 'running'}
                    >
                        <Square className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
                        onClick={() => onAction('restart', service.name)}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

const GroupLabelNode: React.FC<{ data: GroupLabelNodeData }> = ({ data }) => {
    return (
        <div
            className={cn(
                'rounded-md border px-2 py-1 text-[11px] font-semibold shadow-sm bg-white',
                data.colorClass
            )}
        >
            {data.label}
        </div>
    )
}

const DependencyEdge: React.FC<EdgeProps<Edge<DiagramEdgeData>>> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    data
}) => {
    const midX = sourceX + (targetX - sourceX) / 2
    const edgePath = `M ${sourceX} ${sourceY} H ${midX} V ${targetY} H ${targetX}`
    const isRelated = Boolean(data?.related)
    const sourceRunning = Boolean(data?.sourceRunning)

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    stroke: isRelated ? '#0ea5e9' : '#e2e8f0',
                    strokeWidth: isRelated ? 2 : 1.5,
                    strokeDasharray: sourceRunning ? undefined : '4 4'
                }}
            />
            {isRelated ? (
                <circle r="2.5" fill="#0ea5e9">
                    <animateMotion dur="1.6s" repeatCount="indefinite" path={edgePath} />
                </circle>
            ) : null}
        </>
    )
}

const nodeTypes: NodeTypes = {
    service: ServiceNode,
    groupLabel: GroupLabelNode
}

const edgeTypes: EdgeTypes = {
    dependency: DependencyEdge
}

const DiagramZoomControls: React.FC = () => {
    const { zoomIn, zoomOut, setViewport } = useReactFlow()

    const handleResetZoom = (): void => {
        void setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 180 })
    }

    return (
        <Panel
            position="bottom-left"
            data-diagram-ui="true"
            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur"
        >
            <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => void zoomIn({ duration: 180 })}
            >
                +
            </Button>
            <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                onClick={handleResetZoom}
            >
                1:1
            </Button>
            <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => void zoomOut({ duration: 180 })}
            >
                -
            </Button>
        </Panel>
    )
}

interface WorkspaceDiagramProps {
    workspace: IWorkspace
    changeStatus?: boolean
}

const WorkspaceDiagramContent: React.FC<WorkspaceDiagramProps> = ({
    workspace,
    changeStatus = false
}) => {
    const { getViewport, setViewport } = useReactFlow()
    const {
        services,
        loading,
        error,
        startContainers,
        refreshContainers,
        stopService,
        restartService,
        getServiceUrl
    } = useDocker({ workspace, changeStatus })
    const [nodes, setNodes, onNodesChange] = useNodesState<DiagramNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<DiagramEdgeData>>([])
    const [selectedNode, setSelectedNode] = useState<string | null>(null)
    const servicesRef = useRef<ServiceInfo[]>(services)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditService, setEditService] = useState(false)
    const [serviceToEdit, setServiceToEdit] = useState<ServiceInfo | null>(null)
    const [serviceToDelete, setServiceToDelete] = useState<ServiceInfo | null>(null)
    const [contextMenu, setContextMenu] = useState<{
        x: number
        y: number
        visible: boolean
    }>({ x: 0, y: 0, visible: false })
    const [isNewServiceDialogOpen, setIsNewServiceDialogOpen] = useState(false)
    const [isCanvasPanning, setIsCanvasPanning] = useState(false)
    const isPanningRef = useRef(false)
    const lastPanPointRef = useRef<{ x: number; y: number } | null>(null)

    // Refs for handlers to prevent infinite loops
    const handleServiceActionRef = useRef<(action: string, serviceName: string) => Promise<void>>(
        async () => {}
    )
    const handleEditServiceRef = useRef<(service: ServiceInfo) => void>(() => {})
    const handleDeleteServiceRef = useRef<(service: ServiceInfo) => void>(() => {})
    const handleOpenInBrowserRef = useRef<(service: ServiceInfo) => void>(() => {})

    // Memoize defaultViewport to prevent ReactFlow warnings
    const defaultViewport = useMemo(
        () => ({
            x: 0,
            y: 0,
            zoom: 0.5
        }),
        []
    )

    // Update ref when services change
    useEffect(() => {
        servicesRef.current = services
    }, [services])

    const handleServiceAction = useCallback(
        async (action: string, serviceName: string): Promise<void> => {
            try {
                switch (action) {
                    case 'start':
                        try {
                            await restartService([serviceName], 300)
                        } catch {
                            await startContainers()
                        }
                        break
                    case 'stop':
                        await stopService([serviceName])
                        break
                    case 'restart':
                        await restartService([serviceName])
                        break
                    case 'toggle': {
                        // Find the service by name from current services using ref
                        const service = servicesRef.current.find((s) => s.name === serviceName)
                        if (service?.status === 'running') {
                            await stopService([serviceName])
                        } else {
                            try {
                                await restartService([serviceName], 300)
                            } catch {
                                await startContainers()
                            }
                        }
                        break
                    }
                }

                // Refresh status after action
                setTimeout(() => {
                    refreshContainers()
                }, 1000)
            } catch (error) {
                console.error(`Failed to ${action} service ${serviceName}:`, error)
            }
        },
        [startContainers, stopService, restartService, refreshContainers]
    )

    const handleEditService = useCallback((service: ServiceInfo) => {
        setServiceToEdit(service)
        setEditService(true)
    }, [])

    const handleDeleteService = useCallback((service: ServiceInfo) => {
        setServiceToDelete(service)
        setIsDialogOpen(true)
    }, [])

    const handleConfirmDelete = useCallback(async () => {
        // Delete-service is out of scope for the workspace engine now — the
        // dialog is left in place as a no-op guard, and the confirm just
        // dismisses. If Studio grows its own remove flow later, it hooks in
        // here.
        if (!serviceToDelete) return
        setIsDialogOpen(false)
        setServiceToDelete(null)
    }, [serviceToDelete])

    const handleOpenInBrowser = useCallback(
        (service: ServiceInfo) => {
            const url = getServiceUrl(service)
            if (url) {
                window.electron.ipcRenderer.send('open-external-url', url)
            }
        },
        [getServiceUrl]
    )

    // Update refs when handlers change
    useEffect(() => {
        handleServiceActionRef.current = handleServiceAction
        handleEditServiceRef.current = handleEditService
        handleDeleteServiceRef.current = handleDeleteService
        handleOpenInBrowserRef.current = handleOpenInBrowser
    }, [handleServiceAction, handleEditService, handleDeleteService, handleOpenInBrowser])

    // Create nodes and edges from services
    const createNodesAndEdges = useCallback((): void => {
        if (!services || services.length === 0) {
            setNodes([])
            setEdges([])
            return
        }

        const relatedToSelected = new Set<string>()
        if (selectedNode) {
            relatedToSelected.add(selectedNode)
            services.forEach((service) => {
                if (!service.dependsOn || !Array.isArray(service.dependsOn)) return
                service.dependsOn.forEach((dep) => {
                    const depName = typeof dep === 'string' ? dep : Object.keys(dep)[0]
                    if (depName === selectedNode) {
                        relatedToSelected.add(service.name)
                    }
                    if (service.name === selectedNode) {
                        relatedToSelected.add(depName)
                    }
                })
            })
        }

        // Create a hierarchical layout based on dependencies
        const newNodes: DiagramNode[] = []
        const nodeHeight = 132
        const margin = 24
        const levelSpacing = 300
        const stackOrder: DiagramStackId[] = ['main', 'monitoring', 'process', 'project']
        const stackGap = 40

        // Calculate dependency levels
        const calculateLevels = (services: ServiceInfo[]): Map<string, number> => {
            const levels = new Map<string, number>()
            const visited = new Set<string>()
            const visiting = new Set<string>()

            const visit = (serviceName: string, currentLevel: number = 0): number => {
                if (visiting.has(serviceName)) {
                    return currentLevel // Circular dependency
                }
                if (visited.has(serviceName)) {
                    return levels.get(serviceName) || currentLevel
                }

                visiting.add(serviceName)
                const service = services.find((s) => s.name === serviceName)
                let maxDependencyLevel = currentLevel

                if (service?.dependsOn && Array.isArray(service.dependsOn)) {
                    for (const dep of service.dependsOn) {
                        const depName = typeof dep === 'string' ? dep : Object.keys(dep)[0]
                        const depLevel = visit(depName, currentLevel + 1)
                        maxDependencyLevel = Math.max(maxDependencyLevel, depLevel)
                    }
                }

                levels.set(serviceName, maxDependencyLevel)
                visiting.delete(serviceName)
                visited.add(serviceName)
                return maxDependencyLevel
            }

            services.forEach((service) => {
                if (!visited.has(service.name)) {
                    visit(service.name)
                }
            })

            return levels
        }

        const dependencyLevels = calculateLevels(services)
        const maxLevel = Math.max(...Array.from(dependencyLevels.values()))

        // Group services by dependency level
        const levelGroups = new Map<number, ServiceInfo[]>()
        services.forEach((service) => {
            const level = dependencyLevels.get(service.name) || 0
            if (!levelGroups.has(level)) {
                levelGroups.set(level, [])
            }
            levelGroups.get(level)!.push(service)
        })

        // Position nodes by level and grouped by stack
        for (let level = 0; level <= maxLevel; level++) {
            const levelServices = levelGroups.get(level) || []
            const levelX = level * levelSpacing + margin
            let yCursor = margin

            stackOrder.forEach((stackId) => {
                const grouped = levelServices.filter(
                    (service) => resolveDiagramStack(service) === stackId
                )
                if (grouped.length === 0) return

                grouped.forEach((service, index) => {
                    const x = levelX
                    const y = yCursor + index * (nodeHeight + margin)

                    newNodes.push({
                        id: service.name,
                        type: 'service',
                        position: { x, y },
                        data: {
                            service,
                            serviceUrl: getServiceUrl(service),
                            isRelated:
                                selectedNode !== null && relatedToSelected.has(service.name),
                            isMuted:
                                selectedNode !== null && !relatedToSelected.has(service.name),
                            onAction: (action: string, serviceName: string) =>
                                handleServiceActionRef.current?.(action, serviceName),
                            services,
                            onEditService: (service: ServiceInfo) =>
                                handleEditServiceRef.current?.(service),
                            onDeleteService: (service: ServiceInfo) =>
                                handleDeleteServiceRef.current?.(service),
                            onOpenInBrowser: (service: ServiceInfo) =>
                                handleOpenInBrowserRef.current?.(service)
                        },
                        selected: selectedNode === service.name
                    })
                })

                yCursor += grouped.length * (nodeHeight + margin) + stackGap
            })
        }

        // Create edges based on dependencies
        const newEdges: Edge<DiagramEdgeData>[] = []
        services.forEach((service) => {
            if (service.dependsOn && Array.isArray(service.dependsOn)) {
                service.dependsOn.forEach((dep) => {
                    const dependencyName = typeof dep === 'string' ? dep : Object.keys(dep)[0]

                    // Only create edge if both source and target services exist
                    const sourceExists = services.some((s) => s.name === dependencyName)
                    const targetExists = services.some((s) => s.name === service.name)

                    if (sourceExists && targetExists) {
                        const isRelatedToSelected =
                            selectedNode !== null &&
                            relatedToSelected.has(dependencyName) &&
                            relatedToSelected.has(service.name)
                        const sourceService = services.find((s) => s.name === dependencyName)
                        const sourceStatus = resolveDiagramStatus(sourceService)
                        const sourceRunning =
                            sourceStatus === 'healthy' || sourceStatus === 'running'
                        const edgeColor = isRelatedToSelected ? '#0ea5e9' : '#e2e8f0'
                        newEdges.push({
                            id: `${dependencyName}-${service.name}`,
                            source: dependencyName,
                            sourceHandle: 'source',
                            target: service.name,
                            targetHandle: 'target',
                            type: 'dependency',
                            data: {
                                related: isRelatedToSelected,
                                sourceRunning
                            },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                width: 14,
                                height: 14,
                                color: edgeColor
                            }
                        })
                    }
                })
            }
        })

        setNodes(newNodes)
        setEdges(newEdges)
    }, [services, selectedNode, setNodes, setEdges])

    useEffect(() => {
        createNodesAndEdges()
    }, [createNodesAndEdges])

    const handleNodeClick = (_event: React.MouseEvent, node: Node): void => {
        setSelectedNode(node.id)
    }

    const handlePaneClick = (): void => {
        setSelectedNode(null)
    }

    const handleRefresh = async (): Promise<void> => {
        await refreshContainers()
    }

    const handleContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
        event.preventDefault()
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            visible: true
        })
    }, [])

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu({ x: 0, y: 0, visible: false })
    }, [])

    const handleCreateService = useCallback(() => {
        // Open the ConfigurationDialog for creating a new service
        setIsNewServiceDialogOpen(true)
        handleCloseContextMenu()
    }, [handleCloseContextMenu])

    const handleNewServiceDialogClose = useCallback(async () => {
        setIsNewServiceDialogOpen(false)
        // Refresh services after creating a new service
        await refreshContainers()
    }, [refreshContainers])

    const stopCanvasPan = useCallback((): void => {
        isPanningRef.current = false
        lastPanPointRef.current = null
        setIsCanvasPanning(false)
    }, [])

    const canStartCanvasPan = useCallback((target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) return false
        if (target.closest('[data-diagram-ui="true"]')) return false
        if (target.closest('.react-flow__node')) return false
        return Boolean(target.closest('.react-flow__pane') || target.closest('.react-flow__background'))
    }, [])

    const handleCanvasMouseDown = useCallback(
        (event: React.MouseEvent<HTMLDivElement>): void => {
            if (event.button !== 0) return
            if (!canStartCanvasPan(event.target)) return

            isPanningRef.current = true
            lastPanPointRef.current = { x: event.clientX, y: event.clientY }
            setIsCanvasPanning(true)
            event.preventDefault()
        },
        [canStartCanvasPan]
    )

    const handleCanvasMouseMove = useCallback(
        (event: React.MouseEvent<HTMLDivElement>): void => {
            if (!isPanningRef.current || !lastPanPointRef.current) return

            const dx = event.clientX - lastPanPointRef.current.x
            const dy = event.clientY - lastPanPointRef.current.y
            if (dx === 0 && dy === 0) return

            const viewport = getViewport()
            void setViewport(
                {
                    x: viewport.x + dx,
                    y: viewport.y + dy,
                    zoom: viewport.zoom
                },
                { duration: 0 }
            )
            lastPanPointRef.current = { x: event.clientX, y: event.clientY }
        },
        [getViewport, setViewport]
    )

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (): void => {
            if (contextMenu.visible) {
                handleCloseContextMenu()
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [contextMenu.visible, handleCloseContextMenu])

    useEffect(() => {
        const handleMouseUp = (): void => {
            stopCanvasPan()
        }

        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('blur', handleMouseUp)

        return () => {
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('blur', handleMouseUp)
        }
    }, [stopCanvasPan])

    const healthyServices = services.filter((s) => resolveDiagramStatus(s) === 'healthy').length
    const startingServices = services.filter((s) => resolveDiagramStatus(s) === 'starting').length
    const runningServices = services.filter((s) => resolveDiagramStatus(s) === 'running').length
    const totalServices = services.length
    const otherServices = totalServices - (healthyServices + startingServices + runningServices)

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            Docker Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {error.message ||
                                'Docker daemon is not running. Please start Docker to view the workspace diagram.'}
                        </p>
                        <Button onClick={handleRefresh} variant="outline" className="w-full">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="text-gray-900 dark:text-gray-100">Loading services...</span>
                </div>
            </div>
        )
    }

    if (services.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Container className="h-5 w-5" />
                            No Services Found
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            No Docker services found in this workspace. Add services to see them in
                            the diagram.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div
            className={cn(
                'relative h-[calc(100vh-var(--header-height-two)-12rem)] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
                isCanvasPanning ? 'cursor-grabbing' : 'cursor-grab'
            )}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={stopCanvasPan}
            onMouseLeave={stopCanvasPan}
        >
            <div
                data-diagram-ui="true"
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.07] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px]"
            />
            <ReactFlow
                className="relative z-10 bg-transparent"
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                onPaneContextMenu={handleContextMenu}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                minZoom={0.5}
                maxZoom={2}
                defaultViewport={defaultViewport}
                panOnDrag={false}
                panOnScroll={false}
                zoomOnScroll={false}
                nodesDraggable={false}
                selectionOnDrag={false}
            >
                <DiagramZoomControls />
                <Panel
                    position="top-left"
                    data-diagram-ui="true"
                    className="rounded-xl border border-slate-200/60 bg-white/95 p-3 shadow-sm backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Network className="h-4 w-4 text-sky-600" />
                            <span className="text-sm font-medium text-slate-900">
                                Workspace Diagram
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRefresh}
                            className="h-8 border-slate-200 text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refresh
                        </Button>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600">{healthyServices} healthy</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span className="text-amber-600">{startingServices} starting</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-sky-500" />
                            <span className="text-sky-600">{runningServices} running</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-600">{otherServices} other</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-sky-600" />
                            <span className="text-sky-600">{totalServices} total</span>
                        </div>
                    </div>
                </Panel>
            </ReactFlow>

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="fixed z-50 bg-background border rounded-md shadow-lg p-1 min-w-[160px]"
                    style={{
                        left: contextMenu.x,
                        top: contextMenu.y
                    }}
                    onMouseLeave={handleCloseContextMenu}
                >
                    <div
                        onClick={handleCreateService}
                        className="flex items-center gap-2 cursor-pointer px-2 py-1 hover:bg-accent rounded-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Create New Service
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialogDelete
                onConfirm={handleConfirmDelete}
                onClose={() => setIsDialogOpen(false)}
                recordId={serviceToDelete?.name || ''}
                isOpen={isDialogOpen}
            />

            {/* Edit Service Dialog */}
            {serviceToEdit && (
                <ConfigurationDialog
                    service={serviceToEdit}
                    services={services}
                    isNew={false}
                    open={isEditService}
                    setOpen={setEditService}
                >
                    <span className="sr-only">Edit</span>
                </ConfigurationDialog>
            )}

            {/* New Service Dialog */}
            <ConfigurationDialog
                service={undefined}
                services={services}
                isNew={true}
                open={isNewServiceDialogOpen}
                setOpen={handleNewServiceDialogClose}
            >
                <span className="sr-only">Create New Service</span>
            </ConfigurationDialog>
        </div>
    )
}

const WorkspaceDiagram: React.FC<WorkspaceDiagramProps> = ({ workspace, changeStatus }) => {
    return (
        <ReactFlowProvider>
            <WorkspaceDiagramContent workspace={workspace} changeStatus={changeStatus} />
        </ReactFlowProvider>
    )
}

export default WorkspaceDiagram
