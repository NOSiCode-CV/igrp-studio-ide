'use client'

import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@renderer/components/ui/select'
import { Switch } from '@renderer/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Textarea } from '@renderer/components/ui/textarea'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import type {
    Dependency,
    Environment,
    Port,
    Volume,
    WorkspaceService
} from '@igrp/igrp-studio-workspace-engine/dist/interfaces/types'
import { ProjectIcon } from '@renderer/components/shared-ui'
import { getDefaultProperties } from '@renderer/generators/ui/dnd/helpers'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HandlerResponse, ProjectData } from 'src/main/types'
import { getServiceColor, getServiceIcon, networkTypes, serviceTypes } from '../services'

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

export function ConfigurationDialog({
    service,
    services = [],
    projects = [],
    isNew = true,
    project,
    open,
    setOpen
}: ConfigurationDialogProps) {
    const { t } = useTranslation()
    const [name, setName] = useState('')
    const [image, setImage] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<string>('')
    const [ports, setPorts] = useState<string[]>([])
    const [newPort, setNewPort] = useState('')
    const [environments, setEnvironments] = useState<{ key: string; value: string }[]>([])
    const [newEnvName, setNewEnvName] = useState('')
    const [newEnvValue, setNewEnvValue] = useState('')
    const [volumes, setVolumes] = useState<string[]>([])
    const [newVolume, setNewVolume] = useState('')
    const [template, setTemplate] = useState<any>('')
    const [dependsOn, setDependsOn] = useState<string[]>([])
    const [networkType, setNetworkType] = useState('bridge')
    const [customNetwork, setCustomNetwork] = useState('')
    const [useCustomNetwork, setUseCustomNetwork] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [serviceTemplates, setServiceTemplates] = useState<any[]>([])

    const {
        workspace,
        actions: { getTemplatesService, createOrUpdateService, configureService }
    } = useWorkspace()

    const fetchTemplates = async () => {
        const { result } = await getTemplatesService()

        const convertedTemplates =
            result.services?.map((service: any) => {
                const { properties, name, label } = service

                const serviveData: any = getDefaultProperties(properties)

                // Convert ports array to the string format "internal:external"
                const ports =
                    serviveData.ports.map((port: any) => `${port.external}:${port.internal}`) || []

                // Convert environments array to {name, value} format
                const environments =
                    serviveData?.environments?.map((env: any) => ({
                        key: env.key,
                        value: env.value
                    })) || []

                // Convert volumes array to "source:target" format
                const volumes =
                    serviveData.volumes?.map(
                        (vol: any) => `${vol.name}:${vol.path}:${vol.driver}`
                    ) || []

                // Convert dependsOn to depends_on array
                const dependsOn =
                    serviveData.dependsOn?.map((dep: any) =>
                        typeof dep === 'string' ? dep : dep.service
                    ) || []

                // Convert labels array
                const type = serviveData.labels?.find((l: any) => l.key === 'type')?.value || ''

                const labels =
                    serviveData?.labels?.map((env: any) => ({
                        key: env.key,
                        value: env.value
                    })) || []

                // Build the template object
                return {
                    ...serviveData,
                    type,
                    ports,
                    environments,
                    volumes,
                    dependsOn,
                    labels,
                    label,
                    name,
                    container_name: serviveData.container_name,
                    customNetwork: `${workspace.slug}-network`
                }
            }) || []

        setServiceTemplates(convertedTemplates)
    }

    useEffect(() => {
        if (!open) return

        fetchTemplates()

        if (service) {
            const network = service.networks && service.networks[0]
            // Edit mode
            setName(service.name || '')
            setImage(service.image || '')
            setDescription(service.labels?.description || '')
            setType(service.labels?.type || '')
            setPorts(service.ports || [])
            setEnvironments(service.environments || [])
            setVolumes(service.volumes || [])
            setDependsOn(service.dependsOn || [])
            setNetworkType(service.networkType || 'bridge')
            setCustomNetwork(network)
            setUseCustomNetwork(!!network)
        } else {
            // New mode
            setName('')
            setDescription('')
            setImage('')
            setType('')
            setPorts([])
            setEnvironments([])
            setVolumes([])
            setDependsOn([])
            setNetworkType('bridge')
            setCustomNetwork('')
            setUseCustomNetwork(false)
        }
    }, [open, service])

    // Apply template
    const applyTemplate = (templateId: string) => {
        const selectedTemplate = serviceTemplates.find((t) => t.name === templateId)

        if (selectedTemplate) {
            setName(selectedTemplate.name)
            setImage(selectedTemplate.image)
            setType(selectedTemplate.type)
            setPorts([...selectedTemplate.ports])
            setEnvironments([...selectedTemplate.environments])
            setVolumes([...selectedTemplate.volumes])
            setDependsOn([...selectedTemplate.dependsOn])
            setNetworkType(selectedTemplate.networkType)
            setCustomNetwork(selectedTemplate.customNetwork)
            setUseCustomNetwork(!!selectedTemplate.customNetwork)
            setTemplate(selectedTemplate)
        }
    }

    // Add port
    const addPort = () => {
        if (newPort && !ports.includes(newPort)) {
            setPorts([...ports, newPort])
            setNewPort('')
        }
    }

    // Remove port
    const removePort = (port: string) => {
        setPorts(ports.filter((p) => p !== port))
    }

    // Add environment variable
    const addEnvironment = () => {
        if (newEnvName) {
            setEnvironments([...environments, { key: newEnvName, value: newEnvValue }])
            setNewEnvName('')
            setNewEnvValue('')
        }
    }

    // Remove environment variable
    const removeEnvironment = (index: number) => {
        setEnvironments(environments.filter((_, i) => i !== index))
    }

    // Add volume
    const addVolume = () => {
        if (newVolume && !volumes.includes(newVolume)) {
            setVolumes([...volumes, newVolume])
            setNewVolume('')
        }
    }

    // Remove volume
    const removeVolume = (volume: string) => {
        setVolumes(volumes.filter((v) => v !== volume))
    }

    // Toggle dependency
    const toggleDependency = (serviceId: string) => {
        if (dependsOn.includes(serviceId)) {
            setDependsOn(dependsOn.filter((id) => id !== serviceId))
        } else {
            setDependsOn([...dependsOn, serviceId])
        }
    }

    const toggleProjectDependency = (projectId: string) => {
        if (dependsOn.includes(projectId)) {
            setDependsOn(dependsOn.filter((id) => id !== projectId))
        } else {
            setDependsOn([...dependsOn, projectId])
        }
    }

    const mergeLabels = (
        templateLabels: Environment[] = [],
        serviceLabels: Record<string, string> = {},
        formLabels: Record<string, string> = {},
        uuid: string
    ): Environment[] => {
        // Create a map to store labels and prevent duplicates
        const labelsMap = new Map<string, string>()

        labelsMap.set('uuid', uuid || '')

        // Add template labels first (lowest priority)
        templateLabels.forEach((label) => {
            if (!labelsMap.has(label.key)) {
                labelsMap.set(label.key, label.value)
            }
        })

        // Add service labels (highest priority)
        Object.entries(serviceLabels).forEach(([key, value]) => {
            labelsMap.set(key, value)
        })

        // Add form labels (medium priority)
        Object.entries(formLabels).forEach(([key, value]) => {
            if (value) {
                // Only add if value exists
                labelsMap.set(key, value)
            }
        })

        // Convert the map back to an array of Label objects
        return Array.from(labelsMap.entries()).map(([key, value]) => ({
            key,
            value
        }))
    }

    // Handle save
    const handleSave = async () => {
        setIsSubmitting(true)

        // Destructure template with fallback to empty object
        const {
            depends_on: templateDependsOn,
            id: templateId,
            labels: templateLabels = [],
            customNetwork,
            label,
            type,
            name,
            ...templateRest
        } = template || {}

        // Destructure service with fallback to empty object
        const {
            id: serviceId,
            labels: serviceLabels = {},
            properties: serviceProperties = {},
            depends_on: serviceDependsOn,
            name: serviceName,
            status,
            createdAt,
            statusMessage,
            ...serviceRest
        } = service || {}

        // Process ports
        const _ports: Port[] = ports.map((portStr) => {
            const [external, internal] = portStr.split(':').map(Number)
            return { external, internal }
        })

        // Process volumes
        const _volumes: Volume[] = volumes.map((volumeStr) => {
            const [host, container] = volumeStr.split(':')
            return { host: host || '', container: container || '' }
        })

        // Process labels - merge template labels with new ones
        // Use the mergeLabels function
        const _labels = mergeLabels(
            templateLabels,
            serviceLabels,
            { type, description, name },
            serviceLabels.uuid
        )

        //dependencies
        const _dependsOn: Dependency[] = dependsOn.map((depend) => {
            // Handle both string and object cases
            const serviceName =
                typeof depend === 'string'
                    ? depend.replace('{{slug}}', workspace.slug)
                    : (depend as any).service?.replace('{{slug}}', workspace.slug) || ''
            return { service: serviceName }
        })

        const _environments: Environment[] = environments.map(({ key, value }) => {
            return {
                key,
                value: value.replace('{{slug}}', workspace.slug)
            }
        })

        const serviceData: WorkspaceService = {
            id: serviceLabels.uuid || '',
            name: serviceLabels.name || name,
            properties: {
                // Template properties (lowest priority)
                ...templateRest,
                // Service properties (medium priority)
                ...serviceProperties,
                // Form values (highest priority)
                ...serviceRest,
                image,
                ports: _ports,
                environments: _environments,
                volumes: _volumes,
                dependsOn: _dependsOn,
                networks: [{ network: useCustomNetwork ? customNetwork : '' }].filter(
                    (item) => item.network
                ),
                // Merged labels with service labels taking priority
                labels: _labels
            }
        }

        try {
            const { error } = await onSave(serviceData)
            setIsSubmitting(false)
            if (!error) setOpen?.(false)
        } catch (err) {
            console.error(err)
            setIsSubmitting(false)
        }
    }

    const onSave = async (data: WorkspaceService): Promise<HandlerResponse> => {
        if (project) return await configureService({ config: project, service: data })
        else return await createOrUpdateService(data)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isNew ? t('addNewService') : t('addNewService')}</DialogTitle>
                    <DialogDescription>
                        {isNew ? t('configureNewDockerService') : t('modifyDockerService')}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid grid-cols-4 mb-4 w-full">
                        <TabsTrigger value="basic">{t('basic')}</TabsTrigger>
                        <TabsTrigger value="config">{t('configuration')}</TabsTrigger>
                        <TabsTrigger value="dependencies">{t('dependencies')}</TabsTrigger>
                        <TabsTrigger value="network">{t('network')}</TabsTrigger>
                    </TabsList>

                    <div className="pb-4">
                        <TabsContent value="basic" className="mt-0 space-y-4 px-1">
                            {isNew && (
                                <div className="space-y-2">
                                    <Label>{t('templateOptional')}</Label>
                                    <IGRPCombobox
                                        value={template}
                                        onChange={(tmpl) => applyTemplate(tmpl as any)}
                                        options={serviceTemplates.map((template) => {
                                            return {
                                                label: template.label,
                                                value: template.name
                                            }
                                        })}
                                        placeholder={t('selectTemplate')}
                                        className="w-1/2"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t('selectTemplate')}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">{t('serviceName')}</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., postgres-db"
                                    className="h-8"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t('description')}</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('describeServicePlaceholder')}
                                    className="resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="image">{t('dockerImage')}</Label>
                                    <Input
                                        id="image"
                                        value={image}
                                        onChange={(e) => setImage(e.target.value)}
                                        placeholder="e.g., postgres:14"
                                        className="h-8"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">{t('serviceType')}</Label>
                                    <IGRPCombobox
                                        value={type}
                                        onChange={(type) => setType(type as string)}
                                        options={serviceTypes}
                                        placeholder={t('selectType')}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="config" className="mt-0 space-y-4 flex-1 min-h-0">
                            <ScrollArea className="h-[400px]">
                                <div className="flex items-center justify-between mb-3">
                                    <Label>{t('ports')}</Label>
                                    <Badge variant="outline" className="text-xs">
                                        {ports.length} {ports.length === 1 ? 'port' : 'ports'}
                                    </Badge>
                                </div>

                                <div className="border rounded-md p-3 space-y-2 mb-3">
                                    {ports.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {ports.map((port: any, index: number) => (
                                                <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="px-2 py-1 flex items-center gap-1"
                                                >
                                                    <span className="font-mono">{port}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 p-0 ml-1"
                                                        onClick={() => removePort(port)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                            {t('noPortsConfigured')}
                                        </p>
                                    )}

                                    <div className="flex gap-2">
                                        <Input
                                            value={newPort}
                                            onChange={(e) => setNewPort(e.target.value)}
                                            placeholder="e.g., 5432:5432"
                                            className="h-8 flex-1"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-8"
                                            onClick={addPort}
                                            disabled={!newPort}
                                        >
                                            {t('add')}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('portsFormat')}
                                    </p>
                                </div>

                                <div className="space-y-2 mb-3">
                                    <div className="flex items-center justify-between">
                                        <Label>{t('environmentVariables')}</Label>
                                        <Badge variant="outline" className="text-xs">
                                            {environments.length}{' '}
                                            {environments.length === 1
                                                ? t('variable')
                                                : t('variables')}
                                        </Badge>
                                    </div>

                                    <div className="border rounded-md p-3 space-y-2">
                                        {environments.length > 0 ? (
                                            <div className="space-y-2">
                                                {environments.map((env, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                                                            <div className="font-mono bg-muted/50 p-1 rounded truncate">
                                                                {env.key}
                                                            </div>
                                                            <div className="font-mono bg-muted/50 p-1 rounded truncate">
                                                                {env.value}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => removeEnvironment(index)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                                {t('noEnvConfigured')}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                value={newEnvName}
                                                onChange={(e) => setNewEnvName(e.target.value)}
                                                placeholder={t('variableName')}
                                                className="h-8"
                                            />
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newEnvValue}
                                                    onChange={(e) => setNewEnvValue(e.target.value)}
                                                    placeholder={t('value')}
                                                    className="h-8 flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={addEnvironment}
                                                    disabled={!newEnvName}
                                                >
                                                    {t('add')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>{t('volumes')}</Label>
                                        <Badge variant="outline" className="text-xs">
                                            {volumes.length}{' '}
                                            {volumes.length === 1 ? t('volume') : t('volumes')}
                                        </Badge>
                                    </div>

                                    <div className="border rounded-md p-3 space-y-2">
                                        {volumes.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {volumes.map((volume, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="px-2 py-1 flex items-center gap-1"
                                                    >
                                                        <span className="font-mono text-xs truncate max-w-[200px]">
                                                            {volume}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-4 w-4 p-0 ml-1"
                                                            onClick={() => removeVolume(volume)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                                {t('noVolumesConfigured')}
                                            </p>
                                        )}

                                        <div className="flex gap-2">
                                            <Input
                                                value={newVolume}
                                                onChange={(e) => setNewVolume(e.target.value)}
                                                placeholder="e.g., data:/var/lib/data"
                                                className="h-8 flex-1"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-8"
                                                onClick={addVolume}
                                                disabled={!newVolume}
                                            >
                                                {t('add')}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {t('volumesFormat')}
                                        </p>
                                    </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value={t('dependencies')} className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label>{t('describeServicePlaceholder')}</Label>
                                <p className="text-xs text-muted-foreground">
                                    {t('connectedService')}
                                </p>

                                <div className="border rounded-md p-3 space-y-2">
                                    {services.length > 0 ? (
                                        <div className="space-y-2">
                                            {services
                                                .filter(
                                                    (s) =>
                                                        s.name !== service?.name &&
                                                        !s.labels?.is_project
                                                )
                                                .map((s, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={`depends-${index}`}
                                                            checked={dependsOn.includes(s.name)}
                                                            onCheckedChange={() =>
                                                                toggleDependency(s.name)
                                                            }
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`rounded-sm p-1 text-white ${getServiceColor(s.labels?.type)}`}
                                                            >
                                                                {getServiceIcon(s.labels?.type)}
                                                            </div>
                                                            <Label
                                                                htmlFor={`depends-${s.name}`}
                                                                className="text-sm font-normal cursor-pointer"
                                                            >
                                                                {s.name}
                                                            </Label>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                            {t('noOtherServices')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('projectDependencies')}</Label>
                                <p className="text-xs text-muted-foreground">
                                    {t('selectProjects')}
                                </p>

                                <div className="border rounded-md p-3 space-y-2">
                                    {projects.length > 0 ? (
                                        <div className="space-y-2">
                                            {projects
                                                .filter((p) => p.id !== service?.id)
                                                .map((p) => (
                                                    <div
                                                        key={p.id}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={`depends-${p.id}`}
                                                            checked={dependsOn.includes(p.id)}
                                                            onCheckedChange={() =>
                                                                toggleProjectDependency(p.id)
                                                            }
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <ProjectIcon project={p} />
                                                            <Label
                                                                htmlFor={`depends-${p.id}`}
                                                                className="text-sm font-normal cursor-pointer"
                                                            >
                                                                {p.name}
                                                            </Label>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                            {t('noOtherProjects')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="network" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label>{t('networkType')}</Label>
                                <Select value={networkType} onValueChange={setNetworkType}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder={t('selectNetworkType')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {networkTypes.map((network) => (
                                            <SelectItem key={network.id} value={network.id}>
                                                {network.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {t('networkDescription')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="custom-network"
                                        checked={useCustomNetwork}
                                        onCheckedChange={setUseCustomNetwork}
                                    />
                                    <Label htmlFor="custom-network">{t('useCustomNetwork')}</Label>
                                </div>

                                {useCustomNetwork && (
                                    <div className="pl-6 space-y-2">
                                        <Label htmlFor="network-name">{t('networkName')}</Label>
                                        <Input
                                            id="network-name"
                                            value={customNetwork}
                                            onChange={(e) => setCustomNetwork(e.target.value)}
                                            placeholder={t('exampleNetwork')}
                                            className="h-8"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {t('customNetworkName')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => setOpen?.(false)}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting || !name}>
                        {isSubmitting ? t('saving') : t('saveService')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
