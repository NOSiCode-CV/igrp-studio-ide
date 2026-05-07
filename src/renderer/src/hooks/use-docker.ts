import useToast from '@renderer/hooks/useToast'
import yaml from 'js-yaml'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import path from 'path'
import type { IDocker } from 'src/main/interfaces'
import type { DockerComposeConfig, IWorkspace, ProjectData, ServiceInfo } from 'src/main/types'

const AUTO_REFRESH_INTERVAL_MS = 5000
type NginxRoute = { route: string; upstreamHost: string }
type NginxRouting = { listenPort: number; routes: NginxRoute[] }

export function useDocker({
    workspace,
    changeStatus = false
}: {
    workspace?: IWorkspace | null
    changeStatus?: boolean
}): {
    fileContent: string | null
    composeConfig: DockerComposeConfig | null
    services: ServiceInfo[]
    error: Error | null
    loading: boolean
    isDockerRunning: boolean
    getServiceUrl: (service: ServiceInfo) => string | null
    getProjectBrowserUrl: (project: ProjectData, service?: ServiceInfo) => string | null
    loadComposeFile: (projectPath: string) => Promise<void>
    startContainers: () => Promise<void>
    stopContainers: (dropVolume: boolean) => Promise<void>
    refreshContainers: () => Promise<void>
    stopService: (services?: string[]) => Promise<void>
    restartService: (services?: string[], timeout?: number) => Promise<void>
} {
    const [isDockerRunning, setIsDockerRunning] = useState<boolean>(false)

    const [fileContent, setFileContent] = useState<string | null>(null)
    const [services, setServices] = useState<ServiceInfo[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [composeConfig, setComposeConfig] = useState<DockerComposeConfig | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [nginxRouting, setNginxRouting] = useState<NginxRouting | null>(null)
    const [workspaceNginxPort, setWorkspaceNginxPort] = useState<number | null>(null)

    const { showErrorToast } = useToast()

    const dockerOperations: IDocker = useMemo(
        () => ({
            up: async (projectPath: string) => {
                return window.igrpStudio.docker.up(projectPath)
            },
            down: async (projectPath: string, options: { dropVolume?: boolean }) => {
                return window.igrpStudio.docker.down(projectPath, {
                    dropVolume: options.dropVolume
                })
            },
            status: async (projectPath: string) => {
                return window.igrpStudio.docker
                    .status(projectPath)
                    .then((services: ServiceInfo[]) => {
                        setServices(services)
                        return services
                    })
            },
            check: async () => {
                return window.igrpStudio.docker.check()
            },
            daemonStatus: async () => {
                return window.igrpStudio.docker.daemonStatus()
            },
            stop: async (projectPath: string, options: { services: string[] }) => {
                await window.igrpStudio.docker.stop(projectPath, {
                    services: options.services
                })
            },
            restart: async (
                projectPath: string,
                options: { services: string[]; timeout?: number }
            ) => {
                await window.igrpStudio.docker.restart(projectPath, {
                    services: options.services,
                    timeout: options.timeout
                })
            }
        }),
        []
    )

    const checkDocker = useCallback(async () => {
        try {
            const daemonStatus = await dockerOperations.daemonStatus()
            setIsDockerRunning(daemonStatus.isRunning)

            if (!daemonStatus.isRunning) {
                setError(new Error(`${daemonStatus.error}: ${daemonStatus.details}`))
            } else {
                setError(null)
            }

            return daemonStatus.isRunning
        } catch (err) {
            setIsDockerRunning(false)
            setError(err as Error)
            return false
        }
    }, [dockerOperations])

    const handleDockerOperation = useCallback(
        async (
            operation: keyof IDocker,
            options?: {
                services?: string[]
                timeout?: number
                dropVolume?: boolean
            }
        ): Promise<
            | ServiceInfo[]
            | boolean
            | void
            | { isRunning: boolean; error?: string; details?: string }
        > => {
            const { services, timeout, dropVolume } = options || {}

            setLoading(true)

            if (!isDockerRunning && operation !== 'status') {
                const isRunning = await checkDocker()
                if (!isRunning) {
                    setLoading(false)
                    setError(new Error('Docker daemon is not running'))
                    throw new Error('Docker daemon is not running')
                }
            }

            try {
                if (!workspace?.path) {
                    throw new Error('No active workspace selected')
                }
                return await dockerOperations[operation](workspace.path, {
                    services: services ?? [],
                    timeout,
                    dropVolume
                })
            } catch (err) {
                setError(err as Error)
                if (
                    err instanceof Error &&
                    (err.message.includes('ENOENT') || err.message.includes('docker.sock'))
                ) {
                    setIsDockerRunning(false)
                    throw new Error('Docker daemon is not running')
                }
                throw err
            } finally {
                setLoading(false)
            }
        },
        [isDockerRunning, dockerOperations, checkDocker, workspace?.path]
    )

    const getServiceUrl = (service: ServiceInfo): string | null => {
        const serviceName = (service?.name || '').toLowerCase()
        if (serviceName.includes('prometheus')) return null

        const browserHost = workspace?.slug || 'localhost'
        const parsePublishedToken = (value: string | number | undefined): number | null => {
            if (typeof value === 'number') {
                return Number.isNaN(value) ? null : value
            }
            if (!value) return null
            const direct = Number.parseInt(value, 10)
            if (!Number.isNaN(direct)) return direct
            const defaultMatch = value.match(/:-([0-9]+)\}/)
            if (defaultMatch) {
                const fromDefault = Number.parseInt(defaultMatch[1], 10)
                return Number.isNaN(fromDefault) ? null : fromDefault
            }
            return null
        }

        const normalizePublishedPort = (candidate: ServiceInfo): number | null => {
            if (!candidate.ports || candidate.ports.length === 0) return null
            const normalizedPorts = candidate.ports.map((port) => {
                if (typeof port === 'string') {
                    const [published, target] = port.split(':')
                    return {
                        published: parsePublishedToken(published),
                        target: parsePublishedToken(target)
                    }
                }
                return port
            })

            const firstPublished = normalizedPorts.find(
                (port) => typeof port?.published === 'number' && !Number.isNaN(port.published)
            )
            return firstPublished?.published ?? null
        }

        const nginxService = services.find(
            (svc) =>
                svc.name?.toLowerCase().includes('nginx') &&
                Array.isArray(svc.ports) &&
                svc.ports.length > 0
        )
        const nginxPublishedPort = nginxService ? normalizePublishedPort(nginxService) : null
        const resolvedNginxPort =
            typeof nginxPublishedPort === 'number' && nginxPublishedPort > 0
                ? nginxPublishedPort
                : workspaceNginxPort && workspaceNginxPort > 0
                  ? workspaceNginxPort
                  : 2575
        const composeFile = (service.composeFile || '').toLowerCase()
        const isWorkspaceProjectService = composeFile.includes('igrp-projects-compose.yml')
        if (isWorkspaceProjectService && service.name) {
            return `http://${browserHost}:${resolvedNginxPort}/gateway-api/${service.name}/v3/api-docs`
        }

        if (nginxRouting) {
                const directMatch = nginxRouting.routes.find((route) =>
                    route.upstreamHost.toLowerCase().includes(serviceName)
                )
                if (directMatch) {
                return `http://${browserHost}:${resolvedNginxPort}${directMatch.route}`
                }

            // Common aliases from nginx.conf patterns
            const aliases: Array<{ key: string; route: string }> = [
                { key: 'pgadmin', route: '/pgadmin/' },
                { key: 'grafana', route: '/grafana/' },
                { key: 'keycloak', route: '/auth/' },
                { key: 'minio', route: '/minio/' },
                { key: 'eureka', route: '/eureka/' },
                { key: 'gateway', route: '/gateway-api/' },
                { key: 'application-center', route: '/' }
            ]
            const alias = aliases.find((item) => serviceName.includes(item.key))
            if (alias) {
                return `http://${browserHost}:${resolvedNginxPort}${alias.route}`
            }

            if (service.name === nginxService?.name) {
                return `http://${browserHost}:${resolvedNginxPort}/`
            }

            // Fallback for app services proxied through nginx dynamic route /apps/<service>/...
            const isProcessService = composeFile.includes('igrp-process-compose.yaml')
            if (isProcessService && service.name) {
                const serviceNameLower = service.name.toLowerCase()
                if (
                    serviceNameLower.includes('-api') ||
                    serviceNameLower.includes('api-') ||
                    serviceNameLower.endsWith('api')
                ) {
                    return `http://${browserHost}:${resolvedNginxPort}/gateway-api/${service.name}/swagger-ui/index.html`
                }
                return `http://${browserHost}:${resolvedNginxPort}/gateway-api/${service.name}`
            }

            // Generic fallback for project services attached to main stack/nginx:
            // - API-like services through gateway
            // - Frontend-like services through /apps/<service>
            const labelsType = (service.labels?.type || '').toLowerCase()
            if (service.stack === 'main' && service.name) {
                const serviceNameLower = service.name.toLowerCase()
                const looksLikeApi =
                    labelsType.includes('api') ||
                    serviceNameLower.includes('-api') ||
                    serviceNameLower.includes('api-') ||
                    serviceNameLower.endsWith('api')
                if (looksLikeApi) {
                    return `http://${browserHost}:${resolvedNginxPort}/gateway-api/${service.name}/swagger-ui/index.html`
                }
                return `http://${browserHost}:${resolvedNginxPort}/apps/${service.name}`
            }
        }

        const published = normalizePublishedPort(service)
        if (!published) return null
        return `http://${browserHost}:${published}`
    }

    const getProjectBrowserUrl = (project: ProjectData, service?: ServiceInfo): string | null => {
        if (service) return getServiceUrl(service)
        const browserHost = workspace?.slug || 'localhost'
        const resolvedNginxPort = workspaceNginxPort && workspaceNginxPort > 0 ? workspaceNginxPort : 2575
        const projectDir = path.basename(project.path || '').toLowerCase().trim()
        if (!projectDir) return null
        const inferredServiceName = `${browserHost}-${projectDir}`
        return `http://${browserHost}:${resolvedNginxPort}/gateway-api/${inferredServiceName}/v3/api-docs`
    }

    useEffect(() => {
        const loadWorkspaceNginxPort = async (): Promise<void> => {
            if (!workspace?.path) {
                setWorkspaceNginxPort(null)
                return
            }
            try {
                const envPath = `${workspace.path}/.env`
                const raw = await window.api.getFileContent(envPath)
                const envContent = typeof raw === 'string' ? raw : ''
                const lines = envContent.split('\n')
                const hostPortLine = lines.find((line) => line.startsWith('HOST_NGINX_HTTP_PORT='))
                const nginxPortLine = lines.find((line) => line.startsWith('NGINX_HTTP_PORT='))
                const rawValue = (hostPortLine || nginxPortLine || '').split('=')[1]?.trim()
                const parsed = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN
                setWorkspaceNginxPort(Number.isNaN(parsed) ? null : parsed)
            } catch {
                setWorkspaceNginxPort(null)
            }
        }

        void loadWorkspaceNginxPort()
    }, [workspace?.path])

    const parseNginxRouting = (nginxConf: string): NginxRouting | null => {
        const listenMatch = nginxConf.match(/listen\s+(\d+)\s+default_server;/)
        const listenPort = listenMatch ? parseInt(listenMatch[1]) : 80
        if (Number.isNaN(listenPort)) return null

        const routes: NginxRoute[] = []
        const locationRegex = /location\s+([^{]+)\{([\s\S]*?)\}/g
        let locationMatch: RegExpExecArray | null = locationRegex.exec(nginxConf)
        while (locationMatch) {
            const rawLocation = locationMatch[1].trim()
            const block = locationMatch[2]
            const upstreamMatch = block.match(/set\s+\$upstream\s+([^:;\s]+):\d+;/)
            if (upstreamMatch) {
                const upstreamHost = upstreamMatch[1].trim()
                const locationPathMatch = rawLocation.match(/(\/[^\s]*)/)
                const route = locationPathMatch ? locationPathMatch[1].replace(/\^~/g, '').trim() : '/'
                routes.push({
                    route: route.endsWith('/') ? route : `${route}/`,
                    upstreamHost
                })
            }
            locationMatch = locationRegex.exec(nginxConf)
        }

        return { listenPort, routes }
    }

    useEffect(() => {
        if (error) {
            showErrorToast(error)
        }
    }, [error, showErrorToast])

    const loadComposeFile = useCallback(async (projectPath: string): Promise<void> => {
        const composePath = `${projectPath}/igrp-compose.yaml`
        const raw = await window.api.getFileContent(composePath)
        const fileContent = typeof raw === 'string' ? raw : null

        if (!fileContent) {
            setFileContent(null)
            setComposeConfig(null)
            return
        }

        const composeConfig = yaml.load(fileContent) as DockerComposeConfig
        setFileContent(fileContent)
        setComposeConfig(composeConfig)
    }, [])

    const dockerOpRef = useRef(handleDockerOperation)
    useEffect(() => {
        dockerOpRef.current = handleDockerOperation
    }, [handleDockerOperation])

    useEffect(() => {
        if (!workspace?.path) return

        const refreshOnce = async (): Promise<void> => {
            try {
                if (document.visibilityState === 'hidden') return
                await dockerOpRef.current('status')
            } catch {
                // non-blocking
            }
        }

        void refreshOnce()
        return
    }, [workspace?.path])

    useEffect(() => {
        if (!workspace?.path || !changeStatus) return

        let intervalId: number | undefined
        let inFlight = false

        const refreshContainers = async (): Promise<void> => {
            if (inFlight || document.visibilityState === 'hidden') return
            inFlight = true
            try {
                await dockerOpRef.current('status')
            } finally {
                inFlight = false
            }
        }

        void refreshContainers()
        intervalId = window.setInterval(() => {
            void refreshContainers()
        }, AUTO_REFRESH_INTERVAL_MS)

        return () => {
            if (intervalId !== undefined) {
                window.clearInterval(intervalId)
            }
        }
    }, [workspace?.path, changeStatus])

    useEffect(() => {
        if (!workspace?.path) return
        let mounted = true

        const loadNginxRouting = async (): Promise<void> => {
            try {
                const nginxPath = `${workspace.path}/nginx.conf`
                const raw = await window.api.getFileContent(nginxPath)
                const nginxConf = typeof raw === 'string' ? raw : null
                if (!mounted || !nginxConf) return
                setNginxRouting(parseNginxRouting(nginxConf))
            } catch {
                if (mounted) setNginxRouting(null)
            }
        }

        void loadNginxRouting()
        return () => {
            mounted = false
        }
    }, [workspace?.path])

    return {
        fileContent,
        composeConfig,
        services,
        error,
        loading,
        isDockerRunning,
        getServiceUrl,
        getProjectBrowserUrl,
        loadComposeFile,
        startContainers: async () => {
            await handleDockerOperation('up')
        },
        stopContainers: async (dropVolume: boolean) => {
            await handleDockerOperation('down', { dropVolume })
        },
        refreshContainers: async () => {
            await handleDockerOperation('status')
        },
        stopService: async (services?: string[]) => {
            await handleDockerOperation('stop', { services })
        },
        restartService: async (services?: string[], timeout?: number) => {
            await handleDockerOperation('restart', { services, timeout })
        }
    }
}
