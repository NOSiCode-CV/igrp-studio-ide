'use client'

import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@renderer/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Textarea } from '@renderer/components/ui/textarea'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { motion } from 'motion/react'
import {
    Compass,
    Cpu,
    Database,
    FolderKanban,
    HardDrive,
    Layers,
    Network,
    Plus,
    Search,
    Server,
    Settings,
    Shield,
    Trash2,
    Workflow,
    X
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectData } from 'src/main/types'
import { resolveServiceVisualType } from '../services'

interface ConfigurationDialogProps {
    service?: any
    services?: any[]
    projects?: ProjectData[]
    isNew?: boolean
    children?: React.ReactNode
    project?: ProjectData
    open?: boolean
    setOpen?: (open: boolean) => void
}

type ActiveTab = 'basic' | 'config' | 'deps' | 'network'

type DependencyVisualType =
    | 'database'
    | 'web'
    | 'proxy'
    | 'auth'
    | 'service-discovery'
    | 'cache'
    | 'storage'
    | 'observability'

const SERVICE_TYPE_OPTIONS = [
    { value: 'web', label: 'Web Server' },
    { value: 'database', label: 'Database' },
    { value: 'auth', label: 'Auth Service' },
    { value: 'cache', label: 'Cache Service' },
    { value: 'storage', label: 'Storage' }
]

const NETWORK_TYPE_OPTIONS = [
    { value: 'bridge', label: 'Bridge' },
    { value: 'host', label: 'Host' },
    { value: 'none', label: 'None' }
]

const DEPENDENCY_VISUAL_MAP: Record<
    DependencyVisualType,
    {
        icon: React.ComponentType<{ className?: string }>
        colorClass: string
        badgeClass: string
        label: string
    }
> = {
    database: {
        icon: Database,
        colorClass: 'bg-amber-500',
        badgeClass:
            'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/70',
        label: 'Database'
    },
    web: {
        icon: Server,
        colorClass: 'bg-blue-500',
        badgeClass:
            'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/70',
        label: 'Web'
    },
    proxy: {
        icon: Workflow,
        colorClass: 'bg-teal-500',
        badgeClass:
            'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/70',
        label: 'Proxy'
    },
    auth: {
        icon: Shield,
        colorClass: 'bg-red-500',
        badgeClass:
            'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/70',
        label: 'Auth'
    },
    'service-discovery': {
        icon: Cpu,
        colorClass: 'bg-indigo-500',
        badgeClass:
            'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/70',
        label: 'Service Discovery'
    },
    cache: {
        icon: Layers,
        colorClass: 'bg-purple-500',
        badgeClass:
            'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/70',
        label: 'Cache'
    },
    storage: {
        icon: HardDrive,
        colorClass: 'bg-rose-500',
        badgeClass:
            'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/70',
        label: 'Storage'
    },
    observability: {
        icon: Compass,
        colorClass: 'bg-emerald-500',
        badgeClass:
            'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/70',
        label: 'Observability'
    }
}

const FIELD_CLASSNAME =
    'h-9 rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'
const TECHNICAL_FIELD_CLASSNAME = `${FIELD_CLASSNAME} font-mono`
const TEXTAREA_FIELD_CLASSNAME =
    'min-h-[68px] resize-none rounded-sm border border-slate-300 px-2.5 py-1.5 text-xs leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'
const ROW_LABEL_CLASSNAME =
    'w-28 shrink-0 pr-2 text-right text-xs text-slate-500 font-sans dark:text-slate-400'
const SECTION_HEADER_CLASSNAME = 'border-b border-slate-100 pb-1 dark:border-slate-700'
const SECTION_TITLE_CLASSNAME =
    'text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500'
const COUNT_BADGE_CLASSNAME =
    'rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300'
const NEW_SERVICE_MODAL_SIZE_CLASSNAME = 'h-[560px] max-w-[1120px] sm:max-w-[1120px]'
const EDIT_SERVICE_MODAL_SIZE_CLASSNAME = 'h-[440px] max-w-[700px] sm:max-w-[700px]'

const extractDependencyName = (dependency: any): string => {
    if (typeof dependency === 'string') return dependency
    if (dependency && typeof dependency === 'object') {
        if (typeof dependency.service === 'string') return dependency.service
        if (typeof dependency.name === 'string') return dependency.name
    }
    return ''
}

const normalizePorts = (value: any): string[] => {
    if (!Array.isArray(value)) return []
    return value
        .map((port) => {
            if (typeof port === 'string') return port
            if (port && typeof port === 'object') {
                const external = Number.parseInt(String(port.external ?? ''), 10)
                const internal = Number.parseInt(String(port.internal ?? ''), 10)
                if (!Number.isNaN(external) && !Number.isNaN(internal)) {
                    return `${external}:${internal}`
                }
            }
            return ''
        })
        .filter(Boolean)
}

const normalizeVolumes = (value: any): string[] => {
    if (!Array.isArray(value)) return []
    return value
        .map((volume) => {
            if (typeof volume === 'string') return volume
            if (volume && typeof volume === 'object') {
                const host = String(volume.host ?? '').trim()
                const container = String(volume.container ?? '').trim()
                if (host && container) return `${host}:${container}`
            }
            return ''
        })
        .filter(Boolean)
}

const normalizeEnvironments = (value: any): Array<{ key: string; value: string }> => {
    if (!Array.isArray(value)) return []
    return value
        .map((env) => {
            if (env && typeof env === 'object') {
                const key = String(env.key ?? '').trim()
                const val = String(env.value ?? '').trim()
                if (key) return { key, value: val }
            }
            return null
        })
        .filter((item): item is { key: string; value: string } => item !== null)
}

const resolveDependencyType = (serviceLike: any): DependencyVisualType => {
    const resolved = resolveServiceVisualType(serviceLike)
    if (
        resolved === 'database' ||
        resolved === 'web' ||
        resolved === 'proxy' ||
        resolved === 'auth' ||
        resolved === 'service-discovery' ||
        resolved === 'cache' ||
        resolved === 'storage' ||
        resolved === 'observability'
    ) {
        return resolved
    }

    if (resolved === 'monitoring') return 'observability'
    if (resolved === 'discovery') return 'service-discovery'
    return 'web'
}

const stripWorkspacePrefix = (name: string, workspaceSlug?: string): string => {
    if (!name) return ''
    if (!workspaceSlug) return name
    const prefix = `${workspaceSlug}-`
    return name.startsWith(prefix) ? name.slice(prefix.length) : name
}

export function ConfigurationDialog({
    service,
    services = [],
    projects: _projects = [],
    isNew = true,
    project: _project,
    children,
    open,
    setOpen
}: ConfigurationDialogProps) {
    const { t } = useTranslation()
    const { workspace } = useWorkspace()

    const [internalOpen, setInternalOpen] = useState(false)
    const [name, setName] = useState('')
    const [image, setImage] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<string>('web')

    const [ports, setPorts] = useState<string[]>([])
    const [newPort, setNewPort] = useState('')

    const [environments, setEnvironments] = useState<Array<{ key: string; value: string }>>([])
    const [newEnvName, setNewEnvName] = useState('')
    const [newEnvValue, setNewEnvValue] = useState('')

    const [volumes, setVolumes] = useState<string[]>([])
    const [newVolumeHost, setNewVolumeHost] = useState('')
    const [newVolumeContainer, setNewVolumeContainer] = useState('')

    const [dependsOn, setDependsOn] = useState<string[]>([])
    const [dependencyMenuOpen, setDependencyMenuOpen] = useState(false)
    const [dependencySearch, setDependencySearch] = useState('')

    const [networkType, setNetworkType] = useState('bridge')
    const [useCustomNetwork, setUseCustomNetwork] = useState(false)
    const [customNetwork, setCustomNetwork] = useState('')
    const [activeTab, setActiveTab] = useState<ActiveTab>('basic')
    const modalSizeClassName = isNew
        ? NEW_SERVICE_MODAL_SIZE_CLASSNAME
        : EDIT_SERVICE_MODAL_SIZE_CLASSNAME

    const dependencyTriggerRef = useRef<HTMLButtonElement | null>(null)
    const dependencyMenuRef = useRef<HTMLDivElement | null>(null)

    const isControlled = typeof open === 'boolean'
    const isOpen = isControlled ? Boolean(open) : internalOpen

    const handleOpenChange = (nextOpen: boolean): void => {
        if (!isControlled) {
            setInternalOpen(nextOpen)
        }
        setOpen?.(nextOpen)
    }

    useEffect(() => {
        if (!isOpen) return

        if (service) {
            const dependencySource = service.dependsOn || service.properties?.dependsOn || []
            const networkSource =
                service.networks?.[0]?.network ||
                service.networks?.[0] ||
                service.properties?.networks?.[0]?.network ||
                ''

            setName(service.name || service.labels?.name || '')
            setImage(service.image || service.properties?.image || '')
            setDescription(service.labels?.description || '')
            setType(service.labels?.type || resolveServiceVisualType(service) || 'web')
            setPorts(normalizePorts(service.ports || service.properties?.ports || []))
            setEnvironments(
                normalizeEnvironments(
                    service.environments || service.properties?.environments || []
                )
            )
            setVolumes(normalizeVolumes(service.volumes || service.properties?.volumes || []))
            setDependsOn(
                Array.isArray(dependencySource)
                    ? dependencySource.map(extractDependencyName).filter(Boolean)
                    : []
            )
            setNetworkType(
                (service.networkType || service.properties?.networkType || 'bridge').toLowerCase()
            )
            setUseCustomNetwork(Boolean(networkSource))
            setCustomNetwork(typeof networkSource === 'string' ? networkSource : '')
        } else {
            setName('')
            setImage('')
            setDescription('')
            setType('web')
            setPorts([])
            setNewPort('')
            setEnvironments([])
            setNewEnvName('')
            setNewEnvValue('')
            setVolumes([])
            setNewVolumeHost('')
            setNewVolumeContainer('')
            setDependsOn([])
            setNetworkType('bridge')
            setUseCustomNetwork(false)
            setCustomNetwork('')
        }

        setDependencySearch('')
        setDependencyMenuOpen(false)
        setActiveTab('basic')
    }, [isOpen, service])

    useEffect(() => {
        if (!dependencyMenuOpen) return

        const handleMouseDown = (event: MouseEvent): void => {
            const target = event.target as Node
            if (
                dependencyMenuRef.current &&
                !dependencyMenuRef.current.contains(target) &&
                dependencyTriggerRef.current &&
                !dependencyTriggerRef.current.contains(target)
            ) {
                setDependencyMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleMouseDown)
        return () => document.removeEventListener('mousedown', handleMouseDown)
    }, [dependencyMenuOpen])

    const serviceByName = useMemo(() => {
        const map = new Map<string, any>()
        for (const item of services) {
            if (item?.name) map.set(item.name, item)
        }
        return map
    }, [services])

    const dependencyCandidates = useMemo(() => {
        const query = dependencySearch.trim().toLowerCase()
        const currentServiceName = service?.name || ''

        return services
            .filter((item) => Boolean(item?.name) && !item?.labels?.is_project)
            .filter((item) => item.name !== currentServiceName && item.name !== name)
            .filter((item) => !dependsOn.includes(item.name))
            .filter((item) => {
                if (!query) return true
                const visualType = resolveDependencyType(item)
                const displayName = stripWorkspacePrefix(item.name, workspace?.slug).toLowerCase()
                return (
                    displayName.includes(query) ||
                    item.name.toLowerCase().includes(query) ||
                    visualType.includes(query)
                )
            })
    }, [dependsOn, dependencySearch, name, service?.name, services, workspace?.slug])

    const selectedDependencyItems = useMemo(() => {
        return dependsOn.map((depName) => {
            const serviceRef = serviceByName.get(depName)
            return {
                name: depName,
                service: serviceRef,
                type: resolveDependencyType(serviceRef || { labels: { type: 'web' } })
            }
        })
    }, [dependsOn, serviceByName])

    const addPort = (): void => {
        const normalized = newPort.trim()
        if (!normalized || ports.includes(normalized)) return
        setPorts((prev) => [...prev, normalized])
        setNewPort('')
    }

    const removePort = (port: string): void => {
        setPorts((prev) => prev.filter((item) => item !== port))
    }

    const addEnvironment = (): void => {
        const key = newEnvName.trim()
        if (!key) return
        setEnvironments((prev) => [...prev, { key, value: newEnvValue.trim() }])
        setNewEnvName('')
        setNewEnvValue('')
    }

    const removeEnvironment = (index: number): void => {
        setEnvironments((prev) => prev.filter((_, i) => i !== index))
    }

    const addVolume = (): void => {
        const host = newVolumeHost.trim()
        const container = newVolumeContainer.trim()
        if (!host || !container) return
        const value = `${host}:${container}`
        if (volumes.includes(value)) return
        setVolumes((prev) => [...prev, value])
        setNewVolumeHost('')
        setNewVolumeContainer('')
    }

    const removeVolume = (volume: string): void => {
        setVolumes((prev) => prev.filter((item) => item !== volume))
    }

    const addDependency = (dependencyName: string): void => {
        if (!dependencyName || dependsOn.includes(dependencyName)) return
        setDependsOn((prev) => [...prev, dependencyName])
        setDependencySearch('')
        setDependencyMenuOpen(false)
    }

    const removeDependency = (dependencyName: string): void => {
        setDependsOn((prev) => prev.filter((item) => item !== dependencyName))
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}

            <DialogContent
                showCloseButton={false}
                overlayClassName="!z-[10000] bg-slate-950/25 p-4 backdrop-blur-[3px]"
                className={`!z-[10001] flex ${modalSizeClassName} max-h-[94vh] w-full flex-col gap-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-950`}
            >
                <DialogHeader className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                                <Plus className="h-3.5 w-3.5" />
                            </span>
                            <DialogTitle className="text-sm font-medium text-slate-700 dark:text-slate-100">
                                {isNew ? 'New Service' : 'Edit Service'}
                            </DialogTitle>
                        </div>

                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as ActiveTab)}
                    orientation="vertical"
                    className="flex min-h-0 flex-1 overflow-hidden"
                >
                    <div className="w-[160px] shrink-0 border-r border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                            Settings
                        </p>
                        <TabsList className="flex h-auto w-full flex-col gap-1 bg-transparent p-0">
                            {[
                                { id: 'basic', label: t('basic'), icon: Layers },
                                { id: 'config', label: t('configuration'), icon: Settings },
                                { id: 'deps', label: t('dependencies'), icon: FolderKanban },
                                { id: 'network', label: t('network'), icon: Network }
                            ].map((tab) => {
                                const isActive = activeTab === tab.id
                                const Icon = tab.icon
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        onClick={() => setActiveTab(tab.id as ActiveTab)}
                                        className={`relative justify-start gap-2 !border-0 !bg-transparent !shadow-none rounded-sm pl-2.5 pr-2 py-2 text-xs data-[state=active]:!border-0 data-[state=active]:!bg-transparent data-[state=active]:!shadow-none ${
                                            isActive
                                                ? "text-primary font-semibold before:absolute before:bottom-1 before:left-0 before:top-1 before:w-[2px] before:rounded-full before:bg-primary before:content-[''] dark:text-primary"
                                                : 'text-slate-500 hover:text-slate-800 font-medium dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <Icon
                                            className={`h-4 w-4 ${
                                                isActive
                                                    ? 'text-primary dark:text-primary'
                                                    : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                        />
                                        {tab.label}
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-7 py-5 dark:bg-slate-950">
                        <TabsContent value="basic" className="mt-0 space-y-5">
                            <section className="space-y-3">
                                <div className={SECTION_HEADER_CLASSNAME}>
                                    <p className={SECTION_TITLE_CLASSNAME}>Service Identity</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="name" className={ROW_LABEL_CLASSNAME}>
                                        {t('serviceName')}: <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        placeholder="my-service"
                                        className={FIELD_CLASSNAME}
                                    />
                                </div>

                                <div className="flex items-start gap-2">
                                    <Label
                                        htmlFor="description"
                                        className={`${ROW_LABEL_CLASSNAME} pt-2`}
                                    >
                                        {t('description')}:
                                    </Label>
                                    <Textarea
                                        id="description"
                                        rows={2}
                                        value={description}
                                        onChange={(event) => setDescription(event.target.value)}
                                        placeholder={t('describeServicePlaceholder')}
                                        className={TEXTAREA_FIELD_CLASSNAME}
                                    />
                                </div>
                            </section>

                            <section className="space-y-3">
                                <div className={SECTION_HEADER_CLASSNAME}>
                                    <p className={SECTION_TITLE_CLASSNAME}>Docker Configuration</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="image" className={ROW_LABEL_CLASSNAME}>
                                        {t('dockerImage')}: <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="image"
                                        value={image}
                                        onChange={(event) => setImage(event.target.value)}
                                        placeholder="registry/image:tag"
                                        className={TECHNICAL_FIELD_CLASSNAME}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="service-type" className={ROW_LABEL_CLASSNAME}>
                                        {t('serviceType')}:
                                    </Label>
                                    <div className="flex-1">
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger
                                                id="service-type"
                                                className={`${FIELD_CLASSNAME} w-full`}
                                            >
                                                <SelectValue placeholder={t('selectServiceType')} />
                                            </SelectTrigger>
                                            <SelectContent className="z-[10020]">
                                                {SERVICE_TYPE_OPTIONS.map((serviceType) => (
                                                    <SelectItem
                                                        key={serviceType.value}
                                                        value={serviceType.value}
                                                    >
                                                        {serviceType.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </section>
                        </TabsContent>

                        <TabsContent value="config" className="mt-0 space-y-4">
                            <section className="space-y-2">
                                <div
                                    className={`flex items-center justify-between ${SECTION_HEADER_CLASSNAME}`}
                                >
                                    <p className={SECTION_TITLE_CLASSNAME}>Configured Ports</p>
                                    <span className={COUNT_BADGE_CLASSNAME}>
                                        {ports.length} ports
                                    </span>
                                </div>

                                <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                                    {ports.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {ports.map((port) => (
                                                <Badge
                                                    key={port}
                                                    variant="secondary"
                                                    className="rounded-sm border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                                >
                                                    {port}
                                                    <button
                                                        type="button"
                                                        onClick={() => removePort(port)}
                                                        className="ml-1 rounded-sm text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="py-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                                            No ports configured
                                        </p>
                                    )}

                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                        <Input
                                            value={newPort}
                                            onChange={(event) => setNewPort(event.target.value)}
                                            placeholder="e.g., 5432:5432"
                                            className={TECHNICAL_FIELD_CLASSNAME}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={addPort}
                                            className="h-9 rounded-sm border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                            disabled={!newPort.trim()}
                                        >
                                            Add
                                        </Button>
                                    </div>

                                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                        Format: HOST_PORT:CONTAINER_PORT
                                    </p>
                                </div>
                            </section>

                            <section className="space-y-2">
                                <div
                                    className={`flex items-center justify-between ${SECTION_HEADER_CLASSNAME}`}
                                >
                                    <p className={SECTION_TITLE_CLASSNAME}>
                                        Path Parameters / Environment Variables
                                    </p>
                                    <span className={COUNT_BADGE_CLASSNAME}>
                                        {environments.length} Variables
                                    </span>
                                </div>

                                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                                    {environments.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {environments.map((environment, index) => (
                                                <div
                                                    key={`${environment.key}-${index}`}
                                                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-950"
                                                >
                                                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-700 dark:text-slate-200">
                                                        {environment.key}
                                                    </span>
                                                    <span className="text-slate-300 dark:text-slate-600">
                                                        =
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                                        {environment.value}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-sm text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                                                        onClick={() => removeEnvironment(index)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            No Variables Configured
                                        </p>
                                    )}

                                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                        <Input
                                            value={newEnvName}
                                            onChange={(event) => setNewEnvName(event.target.value)}
                                            placeholder="Key"
                                            className={TECHNICAL_FIELD_CLASSNAME}
                                        />
                                        <Input
                                            value={newEnvValue}
                                            onChange={(event) => setNewEnvValue(event.target.value)}
                                            placeholder="Value"
                                            className={TECHNICAL_FIELD_CLASSNAME}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={addEnvironment}
                                            className="h-9 rounded-sm border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                            disabled={!newEnvName.trim()}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-2">
                                <div
                                    className={`flex items-center justify-between ${SECTION_HEADER_CLASSNAME}`}
                                >
                                    <p className={SECTION_TITLE_CLASSNAME}>Configured Volumes</p>
                                    <span className={COUNT_BADGE_CLASSNAME}>
                                        {volumes.length} Volumes
                                    </span>
                                </div>

                                <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                                    {volumes.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {volumes.map((volume) => (
                                                <div
                                                    key={volume}
                                                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-950"
                                                >
                                                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-700 dark:text-slate-200">
                                                        {volume}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-sm text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                                                        onClick={() => removeVolume(volume)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="py-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                                            No storage volumes mounted
                                        </p>
                                    )}

                                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                        <Input
                                            value={newVolumeHost}
                                            onChange={(event) =>
                                                setNewVolumeHost(event.target.value)
                                            }
                                            placeholder="Host Path"
                                            className={TECHNICAL_FIELD_CLASSNAME}
                                        />
                                        <Input
                                            value={newVolumeContainer}
                                            onChange={(event) =>
                                                setNewVolumeContainer(event.target.value)
                                            }
                                            placeholder="Container Path"
                                            className={TECHNICAL_FIELD_CLASSNAME}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={addVolume}
                                            className="h-9 rounded-sm border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                            disabled={
                                                !newVolumeHost.trim() || !newVolumeContainer.trim()
                                            }
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        </TabsContent>

                        <TabsContent value="deps" className="mt-0 space-y-3">
                            <div
                                className={`flex items-center justify-between ${SECTION_HEADER_CLASSNAME}`}
                            >
                                <p className={SECTION_TITLE_CLASSNAME}>Service Dependencies</p>
                                <span className={COUNT_BADGE_CLASSNAME}>
                                    {dependsOn.length} Dependencies
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Configure the startup sequence. This service will only start after
                                its nominated dependencies are healthy.
                            </p>

                            <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                                {selectedDependencyItems.length === 0 ? (
                                    <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-5 text-center dark:border-slate-700 dark:bg-slate-950">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                                            <FolderKanban className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                        </span>
                                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">
                                            No Dependencies Configured
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            This service will start immediately and independently.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {selectedDependencyItems.map((item) => {
                                            const meta = DEPENDENCY_VISUAL_MAP[item.type]
                                            const Icon = meta.icon
                                            return (
                                                <div
                                                    key={item.name}
                                                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
                                                >
                                                    <span
                                                        className={`inline-flex h-5 w-5 items-center justify-center rounded-sm text-white ${meta.colorClass}`}
                                                    >
                                                        <Icon className="h-3 w-3" />
                                                    </span>

                                                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
                                                        {stripWorkspacePrefix(
                                                            item.name,
                                                            workspace?.slug
                                                        )}
                                                    </span>

                                                    <Badge
                                                        variant="outline"
                                                        className={`rounded-sm border px-1.5 py-0.5 text-[9px] uppercase ${meta.badgeClass}`}
                                                    >
                                                        {meta.label}
                                                    </Badge>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-sm text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:text-slate-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                                                        onClick={() => removeDependency(item.name)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                <div className="relative">
                                    <button
                                        ref={dependencyTriggerRef}
                                        type="button"
                                        onClick={() => setDependencyMenuOpen((prev) => !prev)}
                                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:border-primary/50 hover:text-primary dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-primary/60 dark:hover:text-primary"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add Dependency
                                    </button>

                                    {dependencyMenuOpen ? (
                                        <div
                                            ref={dependencyMenuRef}
                                            className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                                        >
                                            <div className="relative mb-2">
                                                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                                <Input
                                                    value={dependencySearch}
                                                    onChange={(event) =>
                                                        setDependencySearch(event.target.value)
                                                    }
                                                    placeholder="Search dependency"
                                                    className={`${FIELD_CLASSNAME} pl-7`}
                                                />
                                            </div>

                                            <div className="max-h-40 space-y-1 overflow-y-auto">
                                                {dependencyCandidates.length > 0 ? (
                                                    dependencyCandidates.map((candidate) => {
                                                        const visualType =
                                                            resolveDependencyType(candidate)
                                                        const meta =
                                                            DEPENDENCY_VISUAL_MAP[visualType]
                                                        const Icon = meta.icon
                                                        return (
                                                            <button
                                                                key={candidate.name}
                                                                type="button"
                                                                onClick={() =>
                                                                    addDependency(candidate.name)
                                                                }
                                                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                                            >
                                                                <span
                                                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-sm text-white ${meta.colorClass}`}
                                                                >
                                                                    <Icon className="h-3 w-3" />
                                                                </span>
                                                                <span className="truncate">
                                                                    {stripWorkspacePrefix(
                                                                        candidate.name,
                                                                        workspace?.slug
                                                                    )}
                                                                </span>
                                                            </button>
                                                        )
                                                    })
                                                ) : (
                                                    <p className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
                                                        No services available
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="network" className="mt-0 space-y-3">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label className={ROW_LABEL_CLASSNAME}>Network Type:</Label>
                                    <Select value={networkType} onValueChange={setNetworkType}>
                                        <SelectTrigger
                                            className={`${FIELD_CLASSNAME} max-w-[140px]`}
                                        >
                                            <SelectValue placeholder="Select network type" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[10020]">
                                            {NETWORK_TYPE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <p className="pl-30 text-xs text-slate-500 dark:text-slate-400">
                                    Choose how this service should connect inside the Docker
                                    network.
                                </p>
                            </div>

                            <div className="space-y-2 rounded-lg bg-white p-3 dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={useCustomNetwork}
                                        onClick={() => setUseCustomNetwork((prev) => !prev)}
                                        className={`relative h-5 w-10 shrink-0 rounded-full border-0 p-0 transition-colors ${
                                            useCustomNetwork
                                                ? 'bg-primary'
                                                : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                    >
                                        <motion.span
                                            className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                                            animate={{ x: useCustomNetwork ? 18 : 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 500,
                                                damping: 34
                                            }}
                                        />
                                    </button>

                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                        Use custom isolated workspace network
                                    </span>
                                </div>

                                {useCustomNetwork ? (
                                    <div className="flex items-center gap-2">
                                        <Label
                                            htmlFor="custom-network-name"
                                            className={ROW_LABEL_CLASSNAME}
                                        >
                                            Network Name:
                                        </Label>
                                        <Input
                                            id="custom-network-name"
                                            value={customNetwork}
                                            onChange={(event) =>
                                                setCustomNetwork(event.target.value)
                                            }
                                            placeholder="workspace-network"
                                            className={TECHNICAL_FIELD_CLASSNAME}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="border-t border-slate-200 px-5 py-3 dark:border-slate-700 sm:justify-end sm:gap-2">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="h-9 min-w-[80px] rounded-sm border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {t('cancel')}
                        </Button>
                    </DialogClose>

                    <DialogClose asChild>
                        <Button className="h-9 min-w-[112px] rounded-sm border border-primary bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                            {t('saveService')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
