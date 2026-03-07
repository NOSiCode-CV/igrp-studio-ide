import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Background,
    BackgroundVariant,
    ConnectionLineType,
    Controls,
    type Edge,
    Handle,
    MarkerType,
    MiniMap,
    type Node,
    type NodeTypes,
    Panel,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState
} from 'reactflow'
import 'reactflow/dist/style.css'

import {
    IGRPButtonPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import { useDocker } from '@renderer/hooks/use-docker'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { cn } from '@renderer/lib/utils'
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Container,
    Database,
    Edit,
    ExternalLink,
    Globe,
    MoreVertical,
    Network,
    Play,
    Plus,
    RefreshCw,
    RotateCcw,
    Server,
    Square,
    Trash
} from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import type { IWorkspace, ServiceInfo } from 'src/main/types'
import { ConfigurationDialog } from './components/configuration-dialog'

// Custom Node Components
interface ServiceNodeData {
    service: ServiceInfo
    onAction: (action: string, serviceName: string) => void
    services: ServiceInfo[]
    onEditService: (service: ServiceInfo) => void
    onDeleteService: (service: ServiceInfo) => void
    onOpenInBrowser: (service: ServiceInfo) => void
}

const ServiceNode: React.FC<{
    data: ServiceNodeData
    selected: boolean
}> = ({ data, selected }) => {
    const { service, onAction, onEditService, onDeleteService, onOpenInBrowser } = data
    const { t } = useTranslation()

    const getServiceUrl = (service: ServiceInfo): string | null => {
        if (!service.ports || service.ports.length === 0) return null

        const port = service.ports[0]
        const portNumber = port.split(':')[0]
        return `http://localhost:${portNumber}`
    }

    const getStatusIcon = (): JSX.Element => {
        switch (service.status) {
            case 'running':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'stopped':
                return <Square className="h-4 w-4 text-red-500" />
            case 'exited':
                return <AlertCircle className="h-4 w-4 text-orange-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusColor = (): string => {
        switch (service.status) {
            case 'running':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            case 'stopped':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            case 'exited':
                return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            default:
                return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
        }
    }

    const getServiceIcon = (): JSX.Element => {
        if (service.name.includes('db') || service.name.includes('database')) {
            return <Database className="h-5 w-5" />
        }
        if (service.name.includes('web') || service.name.includes('frontend')) {
            return <Globe className="h-5 w-5" />
        }
        if (service.name.includes('api') || service.name.includes('backend')) {
            return <Server className="h-5 w-5" />
        }
        return <Container className="h-5 w-5" />
    }

    return (
        <div
            className={cn(
                'bg-white dark:bg-gray-800 border-2 rounded-lg shadow-sm p-3 min-w-[200px] transition-all duration-200 relative',
                getStatusColor(),
                selected && 'ring-2 ring-blue-500 ring-offset-2'
            )}
        >
            {/* Source handle - for outgoing connections */}
            <Handle
                type="source"
                position={Position.Right}
                id="source"
                style={{
                    background: '#10b981',
                    width: 8,
                    height: 8
                }}
            />
            {/* Target handle - for incoming connections */}
            <Handle
                type="target"
                position={Position.Left}
                id="target"
                style={{
                    background: '#6b7280',
                    width: 8,
                    height: 8
                }}
            />
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {getServiceIcon()}
                    <span className="font-medium text-sm">{service.name}</span>
                </div>
                <div className="flex items-center gap-1">
                    {getStatusIcon()}
                    <IGRPDropdownMenuPrimitive>
                        <IGRPDropdownMenuTriggerPrimitive asChild>
                            <IGRPButtonPrimitive variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                            </IGRPButtonPrimitive>
                        </IGRPDropdownMenuTriggerPrimitive>
                        <IGRPDropdownMenuContentPrimitive align="end" className="w-48">
                            {service.status === 'running' ? (
                                <IGRPDropdownMenuItemPrimitive
                                    onClick={() => {
                                        onAction('stop', service.name)
                                    }}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Square className="mr-2 h-4 w-4 text-red-600" />
                                    {t('stopService')}
                                </IGRPDropdownMenuItemPrimitive>
                            ) : (
                                <IGRPDropdownMenuItemPrimitive
                                    onClick={() => {
                                        onAction('start', service.name)
                                    }}
                                    className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                >
                                    <Play className="mr-2 h-4 w-4 text-green-600" />
                                    {t('startService')}
                                </IGRPDropdownMenuItemPrimitive>
                            )}

                            <IGRPDropdownMenuItemPrimitive
                                className="focus:bg-accent"
                                onClick={() => {
                                    onEditService(service)
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('editService')}
                            </IGRPDropdownMenuItemPrimitive>

                            {getServiceUrl(service) && (
                                <IGRPDropdownMenuItemPrimitive
                                    onClick={() => onOpenInBrowser(service)}
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {t('openInBrowser')}
                                </IGRPDropdownMenuItemPrimitive>
                            )}

                            {service.labels?.uuid && (
                                <IGRPDropdownMenuItemPrimitive
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={() => {
                                        onDeleteService(service)
                                    }}
                                >
                                    <Trash className="mr-2 h-4 w-4 text-red-600" />
                                    {t('removeService')}
                                </IGRPDropdownMenuItemPrimitive>
                            )}
                        </IGRPDropdownMenuContentPrimitive>
                    </IGRPDropdownMenuPrimitive>
                </div>
            </div>

            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {service.ports && service.ports.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Network className="h-3 w-3" />
                        <span>{service.ports.join(', ')}</span>
                    </div>
                )}
                {service.image && (
                    <div className="truncate">
                        <span className="text-gray-500 dark:text-gray-400">Image:</span>{' '}
                        {service.image}
                    </div>
                )}
            </div>

            <div className="flex gap-1 mt-2">
                <IGRPButtonPrimitive
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => onAction('start', service.name)}
                    disabled={service.status === 'running'}
                >
                    <Play className="h-3 w-3 mr-1" />
                    Start
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => onAction('stop', service.name)}
                    disabled={service.status !== 'running'}
                >
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => onAction('restart', service.name)}
                >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restart
                </IGRPButtonPrimitive>
            </div>
        </div>
    )
}

const nodeTypes: NodeTypes = {
    service: ServiceNode
}

interface WorkspaceDiagramProps {
    workspace: IWorkspace
    changeStatus?: boolean
}

const WorkspaceDiagramContent: React.FC<WorkspaceDiagramProps> = ({
    workspace,
    changeStatus = false
}) => {
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
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
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

    // Refs for handlers to prevent infinite loops
    const handleServiceActionRef = useRef<(action: string, serviceName: string) => Promise<void>>(
        async () => {}
    )
    const handleEditServiceRef = useRef<(service: ServiceInfo) => void>(() => {})
    const handleDeleteServiceRef = useRef<(service: ServiceInfo) => void>(() => {})
    const handleOpenInBrowserRef = useRef<(service: ServiceInfo) => void>(() => {})
    const { showErrorToast } = useToast()
    const {
        actions: { removeService }
    } = useWorkspace()
    const { t } = useTranslation()

    // Memoize fitViewOptions to prevent ReactFlow warnings
    const fitViewOptions = useMemo(
        () => ({
            padding: 0.1,
            includeHiddenNodes: false,
            minZoom: 0.1,
            maxZoom: 2
        }),
        []
    )

    // Memoize defaultViewport to prevent ReactFlow warnings
    const defaultViewport = useMemo(
        () => ({
            x: 0,
            y: 0,
            zoom: 0.8
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
                        await startContainers()
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
                            await startContainers()
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
        if (!serviceToDelete) return

        setIsDialogOpen(false)
        try {
            await removeService(serviceToDelete.labels.uuid)
            setServiceToDelete(null)
        } catch (error: unknown) {
            showErrorToast(error)
        }
    }, [serviceToDelete, removeService, showErrorToast])

    const handleOpenInBrowser = useCallback(
        (service: ServiceInfo) => {
            const url = getServiceUrl(service)
            if (url) {
                window.electron.ipcRenderer.send(t('openExternalUrl'), url)
            }
        },
        [getServiceUrl, t]
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

        // Create a hierarchical layout based on dependencies
        const newNodes: Node[] = []
        const nodeHeight = 150
        const margin = 40
        const levelSpacing = 350

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

        // Position nodes by level - vertically arranged with better spacing
        for (let level = 0; level <= maxLevel; level++) {
            const levelServices = levelGroups.get(level) || []
            const levelX = level * levelSpacing + margin

            levelServices.forEach((service, index) => {
                const startY = margin + index * (nodeHeight + margin)
                const x = levelX
                const y = startY

                newNodes.push({
                    id: service.name,
                    type: 'service',
                    position: { x, y },
                    data: {
                        service,
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
        }

        // Create edges based on dependencies
        const newEdges: Edge[] = []
        services.forEach((service) => {
            if (service.dependsOn && Array.isArray(service.dependsOn)) {
                service.dependsOn.forEach((dep) => {
                    const dependencyName = typeof dep === 'string' ? dep : Object.keys(dep)[0]

                    // Only create edge if both source and target services exist
                    const sourceExists = services.some((s) => s.name === dependencyName)
                    const targetExists = services.some((s) => s.name === service.name)

                    if (sourceExists && targetExists) {
                        newEdges.push({
                            id: `${dependencyName}-${service.name}`,
                            source: dependencyName,
                            sourceHandle: 'source',
                            target: service.name,
                            targetHandle: 'target',
                            type: 'smoothstep',
                            animated: service.status === 'running',
                            style: {
                                stroke: service.status === 'running' ? '#10b981' : '#6b7280',
                                strokeWidth: 3
                            },
                            label: 'depends on',
                            labelStyle: {
                                fontSize: '10px',
                                fill: '#6b7280',
                                fontWeight: 'bold'
                            },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                width: 20,
                                height: 20,
                                color: service.status === 'running' ? '#10b981' : '#6b7280'
                            }
                        })
                    }
                })
            }
        })

        // Test: Create a simple edge between first two services if we have at least 2 services
        if (services.length >= 2 && newEdges.length === 0) {
            newEdges.push({
                id: 'test-edge',
                source: services[0].name,
                sourceHandle: 'source',
                target: services[1].name,
                targetHandle: 'target',
                type: 'smoothstep',
                animated: false,
                style: {
                    stroke: '#ff0000',
                    strokeWidth: 3
                },
                label: 'test',
                labelStyle: {
                    fontSize: '10px',
                    fill: '#ff0000',
                    fontWeight: 'bold'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#ff0000'
                }
            })
        }

        setNodes(newNodes)
        setEdges(newEdges)
    }, [services, selectedNode, setNodes, setEdges])

    useEffect(() => {
        createNodesAndEdges()
    }, [createNodesAndEdges])

    const handleNodeClick = (_event: React.MouseEvent, node: Node): void => {
        setSelectedNode(node.id)
    }

    const handleRefresh = async (): Promise<void> => {
        await refreshContainers()
    }

    const handleContextMenu = useCallback((event: React.MouseEvent) => {
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

    const runningServices = services.filter((s) => s.status === 'running').length
    const totalServices = services.length

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <IGRPCardPrimitive className="w-96">
                    <IGRPCardHeaderPrimitive>
                        <IGRPCardTitlePrimitive className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            Docker Error
                        </IGRPCardTitlePrimitive>
                    </IGRPCardHeaderPrimitive>
                    <IGRPCardContentPrimitive>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {error.message ||
                                'Docker daemon is not running. Please start Docker to view the workspace diagram.'}
                        </p>
                        <IGRPButtonPrimitive
                            onClick={handleRefresh}
                            variant="outline"
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </IGRPButtonPrimitive>
                    </IGRPCardContentPrimitive>
                </IGRPCardPrimitive>
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
                <IGRPCardPrimitive className="w-96">
                    <IGRPCardHeaderPrimitive>
                        <IGRPCardTitlePrimitive className="flex items-center gap-2">
                            <Container className="h-5 w-5" />
                            No Services Found
                        </IGRPCardTitlePrimitive>
                    </IGRPCardHeaderPrimitive>
                    <IGRPCardContentPrimitive>
                        <p className="text-sm text-gray-600">
                            No Docker services found in this workspace. Add services to see them in
                            the diagram.
                        </p>
                    </IGRPCardContentPrimitive>
                </IGRPCardPrimitive>
            </div>
        )
    }

    return (
        <div className="w-full border rounded-lg h-[calc(100vh-var(--header-height-two)-12rem)]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onPaneContextMenu={handleContextMenu}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={fitViewOptions}
                minZoom={0.1}
                maxZoom={2}
                defaultViewport={defaultViewport}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        const service = node.data?.service
                        switch (service?.status) {
                            case 'running':
                                return '#10b981'
                            case 'stopped':
                                return '#ef4444'
                            case 'exited':
                                return '#f97316'
                            default:
                                return '#6b7280'
                        }
                    }}
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                />
                <Panel
                    position="top-left"
                    className="bg-white/80 dark:bg-gray-800/25 backdrop-blur-sm rounded-lg p-3 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Workspace Diagram
                            </span>
                        </div>
                        <IGRPButtonPrimitive
                            size="sm"
                            variant="outline"
                            onClick={handleRefresh}
                            className="h-8"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refresh
                        </IGRPButtonPrimitive>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{runningServices} running</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span>{totalServices - runningServices} stopped</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Container className="h-3 w-3 text-blue-500" />
                            <span>{totalServices} total</span>
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
