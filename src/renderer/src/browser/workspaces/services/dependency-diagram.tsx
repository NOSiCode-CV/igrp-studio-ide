import { Button } from '@renderer/components/ui/button'
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Compass,
    Database,
    Globe,
    HardDrive,
    Layers,
    Network,
    Play,
    RefreshCw,
    Server,
    Shield,
    Square,
    Stethoscope,
    Workflow
} from 'lucide-react'
import { type ComponentType, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ServiceInfo } from 'src/main/types'

export type Status = 'running' | 'stopped' | 'error'

export type ServiceType =
    | 'database'
    | 'web'
    | 'proxy'
    | 'auth'
    | 'service-discovery'
    | 'cache'
    | 'storage'
    | 'observability'

export interface Service {
    name: string
    labels: {
        type?: string
    }
    status: Status
    ports: string[]
    dependsOn: string[]
    image?: string
}

interface DiagramNode {
    service: Service
    x: number
    y: number
}

interface DiagramEdge {
    id: string
    source: string
    target: string
    sourceRunning: boolean
}

interface DependencyDiagramProps {
    services: ServiceInfo[]
    onStart?: (serviceName: string) => Promise<void> | void
    onStop?: (serviceName: string) => Promise<void> | void
    onRestart?: (serviceName: string) => Promise<void> | void
    onRefresh?: () => Promise<void> | void
}

type Tier = 'proxy' | 'web' | 'logic' | 'data'

const COL_WIDTH = 220
const ROW_HEIGHT = 120
const NODE_WIDTH = 190
const NODE_HEIGHT = 112
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2

const TYPE_META: Record<
    ServiceType,
    {
        bg: string
        Icon: ComponentType<{ className?: string }>
    }
> = {
    database: { bg: 'bg-amber-500', Icon: Database },
    web: { bg: 'bg-blue-500', Icon: Globe },
    proxy: { bg: 'bg-teal-500', Icon: Workflow },
    auth: { bg: 'bg-red-500', Icon: Shield },
    'service-discovery': { bg: 'bg-indigo-500', Icon: Compass },
    cache: { bg: 'bg-purple-500', Icon: Server },
    storage: { bg: 'bg-orange-500', Icon: HardDrive },
    observability: { bg: 'bg-fuchsia-500', Icon: Stethoscope }
}

const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value))

const KNOWN_TYPES = new Set<ServiceType>([
    'database',
    'web',
    'proxy',
    'auth',
    'service-discovery',
    'cache',
    'storage',
    'observability'
])

const toStatus = (service: ServiceInfo): Status => {
    const status = (service.status || '').toLowerCase()
    const statusMessage = (service.statusMessage || '').toLowerCase()

    if (status === 'running' || status === 'healthy') {
        if (statusMessage.includes('unhealthy') || statusMessage.includes('error')) return 'error'
        return 'running'
    }

    if (
        status === 'error' ||
        statusMessage.includes('error') ||
        statusMessage.includes('unhealthy')
    ) {
        return 'error'
    }

    return 'stopped'
}

const toServiceType = (service: ServiceInfo): ServiceType => {
    const explicitType = (service.labels?.type || '').toLowerCase().trim()
    if (KNOWN_TYPES.has(explicitType as ServiceType)) {
        return explicitType as ServiceType
    }

    const fingerprint =
        `${service.name || ''} ${service.container_name || ''} ${service.image || ''}`.toLowerCase()
    if (
        fingerprint.includes('postgres') ||
        fingerprint.includes('mysql') ||
        fingerprint.includes('db')
    ) {
        return 'database'
    }
    if (
        fingerprint.includes('gateway') ||
        fingerprint.includes('proxy') ||
        fingerprint.includes('nginx')
    ) {
        return 'proxy'
    }
    if (fingerprint.includes('keycloak') || fingerprint.includes('auth')) return 'auth'
    if (fingerprint.includes('eureka') || fingerprint.includes('discovery'))
        return 'service-discovery'
    if (fingerprint.includes('redis') || fingerprint.includes('cache')) return 'cache'
    if (fingerprint.includes('minio') || fingerprint.includes('storage')) return 'storage'
    if (
        fingerprint.includes('prometheus') ||
        fingerprint.includes('grafana') ||
        fingerprint.includes('tempo') ||
        fingerprint.includes('loki') ||
        fingerprint.includes('otel') ||
        fingerprint.includes('opentelemetry') ||
        fingerprint.includes('cadvisor')
    ) {
        return 'observability'
    }
    return 'web'
}

const toDependsOn = (service: ServiceInfo): string[] => {
    const dependsOn = service.dependsOn || []
    if (!Array.isArray(dependsOn)) return []
    return dependsOn
        .map((dep) => {
            if (typeof dep === 'string') return dep
            const key = Object.keys(dep || {})[0]
            return key || ''
        })
        .filter(Boolean)
}

const toDiagramService = (service: ServiceInfo): Service => ({
    name: service.name,
    labels: {
        type: toServiceType(service)
    },
    status: toStatus(service),
    ports: service.ports || [],
    dependsOn: toDependsOn(service),
    image: service.image
})

const toTier = (type: ServiceType): Tier => {
    if (type === 'proxy') return 'proxy'
    if (type === 'web') return 'web'
    if (type === 'auth' || type === 'service-discovery' || type === 'observability') return 'logic'
    return 'data'
}

export function DependencyDiagram({
    services,
    onStart,
    onStop,
    onRestart,
    onRefresh
}: DependencyDiagramProps): React.JSX.Element {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null)
    const [selection, setSelection] = useState<string | null>(null)
    const [zoom, setZoom] = useState(0.5)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof document === 'undefined') return false
        return document.documentElement.classList.contains('dark')
    })
    const containerRef = useRef<HTMLDivElement | null>(null)
    const didPanRef = useRef(false)
    const hasManualPanRef = useRef(false)
    const lastPanPointRef = useRef<{ x: number; y: number } | null>(null)

    const normalizedServices = useMemo(() => {
        return services.filter((service) => Boolean(service.name)).map(toDiagramService)
    }, [services])

    const nodes = useMemo(() => {
        const tierOrder: Tier[] = ['proxy', 'web', 'logic', 'data']
        const grouped: Record<Tier, Service[]> = {
            proxy: [],
            web: [],
            logic: [],
            data: []
        }

        normalizedServices
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((service) => {
                const type = (service.labels.type || 'web') as ServiceType
                grouped[toTier(type)].push(service)
            })

        const positioned: DiagramNode[] = []
        tierOrder.forEach((tier, colIndex) => {
            grouped[tier].forEach((service, rowIndex) => {
                positioned.push({
                    service,
                    x: 150 + colIndex * COL_WIDTH,
                    y: 60 + rowIndex * ROW_HEIGHT
                })
            })
        })

        return positioned
    }, [normalizedServices])

    const nodeByName = useMemo(() => {
        return new Map(nodes.map((node) => [node.service.name, node]))
    }, [nodes])

    const edges = useMemo(() => {
        const nextEdges: DiagramEdge[] = []
        nodes.forEach((node) => {
            node.service.dependsOn.forEach((dependencyName) => {
                const sourceNode = nodeByName.get(dependencyName)
                if (!sourceNode) return
                nextEdges.push({
                    id: `${dependencyName}->${node.service.name}`,
                    source: dependencyName,
                    target: node.service.name,
                    sourceRunning: sourceNode.service.status === 'running'
                })
            })
        })
        return nextEdges
    }, [nodes, nodeByName])

    const relatedNodes = useMemo(() => {
        const related = new Set<string>()
        if (!selection) return related
        related.add(selection)
        edges.forEach((edge) => {
            if (edge.source === selection || edge.target === selection) {
                related.add(edge.source)
                related.add(edge.target)
            }
        })
        return related
    }, [edges, selection])

    const metrics = useMemo(() => {
        const running = normalizedServices.filter((service) => service.status === 'running').length
        const error = normalizedServices.filter((service) => service.status === 'error').length
        const stopped = normalizedServices.filter((service) => service.status === 'stopped').length
        return {
            healthy: running,
            starting: 0,
            running,
            other: error + stopped,
            total: normalizedServices.length
        }
    }, [normalizedServices])

    const canvasWidth = useMemo(() => {
        const maxX = nodes.reduce((acc, node) => Math.max(acc, node.x), 0)
        return Math.max(1100, maxX + NODE_WIDTH + 220)
    }, [nodes])

    const canvasHeight = useMemo(() => {
        const maxY = nodes.reduce((acc, node) => Math.max(acc, node.y), 0)
        return Math.max(680, maxY + NODE_HEIGHT + 140)
    }, [nodes])

    const nodeBounds = useMemo(() => {
        if (!nodes.length) {
            return {
                centerX: canvasWidth / 2,
                centerY: canvasHeight / 2
            }
        }

        const minX = nodes.reduce((acc, node) => Math.min(acc, node.x), Number.POSITIVE_INFINITY)
        const maxX = nodes.reduce((acc, node) => Math.max(acc, node.x + NODE_WIDTH), 0)
        const minY = nodes.reduce((acc, node) => Math.min(acc, node.y), Number.POSITIVE_INFINITY)
        const maxY = nodes.reduce((acc, node) => Math.max(acc, node.y + NODE_HEIGHT), 0)

        return {
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        }
    }, [canvasHeight, canvasWidth, nodes])

    useEffect(() => {
        if (typeof document === 'undefined') return
        const root = document.documentElement

        const syncTheme = (): void => {
            setIsDark(root.classList.contains('dark'))
        }

        syncTheme()
        const observer = new MutationObserver(syncTheme)
        observer.observe(root, { attributes: true, attributeFilter: ['class'] })

        return () => {
            observer.disconnect()
        }
    }, [])

    const defaultEdgeColor = isDark ? '#334155' : '#e2e8f0'
    const dotGridColor = isDark ? '#94a3b8' : '#0f172a'

    const stopPanning = (): void => {
        setIsPanning(false)
        lastPanPointRef.current = null
    }

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>): void => {
        if (event.button !== 0) return
        const target = event.target as HTMLElement
        if (target.closest('[data-diagram-ui="true"]')) return
        if (target.closest('[data-diagram-node="true"]')) return
        didPanRef.current = false
        setIsPanning(true)
        lastPanPointRef.current = { x: event.clientX, y: event.clientY }
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>): void => {
        if (!isPanning || !lastPanPointRef.current) return
        const dx = event.clientX - lastPanPointRef.current.x
        const dy = event.clientY - lastPanPointRef.current.y
        if (dx === 0 && dy === 0) return
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
        if (Math.abs(dx) + Math.abs(dy) > 1) {
            didPanRef.current = true
            hasManualPanRef.current = true
        }
        lastPanPointRef.current = { x: event.clientX, y: event.clientY }
    }

    const handleCanvasClick = (): void => {
        if (didPanRef.current) {
            didPanRef.current = false
            return
        }
        setSelection(null)
    }

    const zoomIn = (): void => setZoom((prev) => clamp(prev + 0.1, MIN_ZOOM, MAX_ZOOM))
    const zoomOut = (): void => setZoom((prev) => clamp(prev - 0.1, MIN_ZOOM, MAX_ZOOM))
    const resetZoom = (): void => setZoom(1)

    useLayoutEffect(() => {
        if (hasManualPanRef.current) return
        const container = containerRef.current
        if (!container) return
        const centeredX = container.clientWidth / 2 - nodeBounds.centerX * zoom
        const centeredY = container.clientHeight / 2 - nodeBounds.centerY * zoom
        setPan({ x: centeredX, y: centeredY })
    }, [nodeBounds, zoom])

    return (
        <div
            ref={containerRef}
            className={`relative h-[calc(100vh-var(--header-height-two)-12rem)] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 ${
                isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopPanning}
            onMouseLeave={stopPanning}
            onClick={handleCanvasClick}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.16]"
                style={{
                    backgroundImage: `radial-gradient(${dotGridColor} 1px, transparent 1px)`,
                    backgroundSize: '16px 16px'
                }}
            />

            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="relative"
                    style={{
                        width: canvasWidth,
                        height: canvasHeight,
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0'
                    }}
                >
                    <svg
                        className="pointer-events-none absolute inset-0"
                        width={canvasWidth}
                        height={canvasHeight}
                    >
                        <defs>
                            <marker
                                id="arrow-default"
                                markerWidth="8"
                                markerHeight="8"
                                refX="6"
                                refY="4"
                                orient="auto"
                            >
                                <path d="M0,0 L8,4 L0,8 Z" fill={defaultEdgeColor} />
                            </marker>
                            <marker
                                id="arrow-related"
                                markerWidth="8"
                                markerHeight="8"
                                refX="6"
                                refY="4"
                                orient="auto"
                            >
                                <path d="M0,0 L8,4 L0,8 Z" fill="#0ea5e9" />
                            </marker>
                        </defs>
                        {edges.map((edge) => {
                            const source = nodeByName.get(edge.source)
                            const target = nodeByName.get(edge.target)
                            if (!source || !target) return null

                            const startX = source.x + NODE_WIDTH
                            const startY = source.y + NODE_HEIGHT / 2
                            const endX = target.x
                            const endY = target.y + NODE_HEIGHT / 2
                            const midX = startX + (endX - startX) / 2
                            const path = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`
                            const isRelated =
                                selection !== null &&
                                (edge.source === selection || edge.target === selection)

                            return (
                                <g key={edge.id}>
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke={isRelated ? '#0ea5e9' : defaultEdgeColor}
                                        strokeWidth={isRelated ? 2 : 1.5}
                                        strokeDasharray={edge.sourceRunning ? undefined : '4 4'}
                                        markerEnd={
                                            isRelated
                                                ? 'url(#arrow-related)'
                                                : 'url(#arrow-default)'
                                        }
                                    />
                                    {isRelated ? (
                                        <circle r="2.6" fill="#0ea5e9">
                                            <animateMotion
                                                dur="1.6s"
                                                repeatCount="indefinite"
                                                path={path}
                                            />
                                        </circle>
                                    ) : null}
                                </g>
                            )
                        })}
                    </svg>

                    {nodes.map((node) => {
                        const serviceType = (node.service.labels.type || 'web') as ServiceType
                        const visual = TYPE_META[serviceType]
                        const TypeIcon = visual.Icon
                        const status = node.service.status
                        const isRunning = status === 'running'
                        const isError = status === 'error'
                        const isSelected = selection === node.service.name
                        const isHovered = hoveredNode === node.service.name
                        const isHighlighted = isSelected || isHovered
                        const isDimmed = selection !== null && !relatedNodes.has(node.service.name)

                        const ledColor = isRunning ? '#4DB33D' : isError ? '#EC1111' : '#999999'
                        const portsLabel = node.service.ports.length
                            ? node.service.ports.join(', ')
                            : 'none'

                        return (
                            <div
                                key={node.service.name}
                                data-diagram-node="true"
                                className={`absolute overflow-hidden rounded-lg border-2 bg-white font-mono shadow-sm transition-all dark:bg-slate-900 ${
                                    isHighlighted
                                        ? 'border-sky-500 ring-4 ring-sky-500/10'
                                        : 'border-slate-200 dark:border-slate-700'
                                } ${isHovered ? 'z-20 scale-[1.05]' : 'scale-100'} ${isDimmed ? 'opacity-[0.35]' : 'opacity-100'}`}
                                style={{ width: NODE_WIDTH, left: node.x, top: node.y }}
                                onMouseEnter={() => setHoveredNode(node.service.name)}
                                onMouseLeave={() =>
                                    setHoveredNode((prev) =>
                                        prev === node.service.name ? null : prev
                                    )
                                }
                                onClick={(event) => {
                                    event.stopPropagation()
                                    if (didPanRef.current) {
                                        didPanRef.current = false
                                        return
                                    }
                                    setSelection(node.service.name)
                                }}
                            >
                                <div className="flex h-8 items-center justify-between border-b border-slate-200 px-2 dark:border-slate-700">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                        <span
                                            className={`flex h-4 w-4 items-center justify-center rounded-sm text-white ${visual.bg}`}
                                        >
                                            <TypeIcon className="h-2.5 w-2.5" />
                                        </span>
                                        <span className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                                            {node.service.name}
                                        </span>
                                    </div>
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${isRunning ? 'animate-pulse shadow-[0_0_0_4px_rgba(77,179,61,0.2)]' : ''}`}
                                        style={{ backgroundColor: ledColor }}
                                    />
                                </div>

                                <div className="space-y-1 px-2 py-1.5">
                                    <div className="text-[8px] uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                                        {serviceType}
                                    </div>
                                    <div className="truncate text-[9px] text-slate-500 dark:text-slate-400">
                                        {portsLabel}
                                    </div>
                                    <div className="truncate text-[9px] text-slate-500 dark:text-slate-400">
                                        <span className="text-slate-400 dark:text-slate-500">
                                            image:
                                        </span>{' '}
                                        {node.service.image || 'none'}
                                    </div>
                                </div>

                                <div className="flex h-8 items-center justify-between border-t border-slate-200 px-2 dark:border-slate-700">
                                    <span
                                        className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${
                                            isRunning
                                                ? 'text-[#4DB33D]'
                                                : isError
                                                  ? 'text-[#EC1111]'
                                                  : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                    >
                                        {status}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        <button
                                            type="button"
                                            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-all hover:bg-white hover:text-emerald-600 hover:shadow-sm disabled:pointer-events-none disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
                                            disabled={isRunning}
                                            onClick={async (event) => {
                                                event.stopPropagation()
                                                if (onStart) await onStart(node.service.name)
                                            }}
                                        >
                                            <Play className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-all hover:bg-white hover:text-rose-600 hover:shadow-sm disabled:pointer-events-none disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-rose-300"
                                            disabled={!isRunning}
                                            onClick={async (event) => {
                                                event.stopPropagation()
                                                if (onStop) await onStop(node.service.name)
                                            }}
                                        >
                                            <Square className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-all hover:bg-white hover:text-sky-600 hover:shadow-sm dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                                            onClick={async (event) => {
                                                event.stopPropagation()
                                                if (onRestart) await onRestart(node.service.name)
                                            }}
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div
                data-diagram-ui="true"
                className="absolute left-3 top-3 rounded-xl border border-slate-200/60 bg-white/95 p-3 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/95"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Workspace Diagram
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-slate-200 text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-700 dark:hover:bg-sky-900/30 dark:hover:text-sky-300"
                        onClick={() => void onRefresh?.()}
                    >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Refresh
                    </Button>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {metrics.healthy} healthy
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-600">
                        <Clock className="h-3 w-3 text-amber-500" />
                        {metrics.starting} starting
                    </span>
                    <span className="inline-flex items-center gap-1 text-sky-600">
                        <CheckCircle2 className="h-3 w-3 text-sky-500" />
                        {metrics.running} running
                    </span>
                    <span className="inline-flex items-center gap-1 text-orange-600">
                        <AlertCircle className="h-3 w-3 text-orange-500" />
                        {metrics.other} other
                    </span>
                    <span className="inline-flex items-center gap-1 text-sky-700">
                        <Layers className="h-3 w-3 text-sky-600" />
                        {metrics.total} total
                    </span>
                </div>
            </div>

            <div
                data-diagram-ui="true"
                className="absolute bottom-3 left-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90"
            >
                <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={zoomIn}
                >
                    +
                </Button>
                <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={resetZoom}
                >
                    1:1
                </Button>
                <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={zoomOut}
                >
                    -
                </Button>
            </div>
        </div>
    )
}
