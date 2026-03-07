import useToast from '@renderer/hooks/useToast'
import yaml from 'js-yaml'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { IDocker } from 'src/main/interfaces'
import type { DockerComposeConfig, IWorkspace, ServiceInfo } from 'src/main/types'

export function useDocker({
    workspace,
    changeStatus = false
}: {
    workspace: IWorkspace
    changeStatus?: boolean
}): {
    fileContent: string | null
    composeConfig: DockerComposeConfig | null
    services: ServiceInfo[]
    error: Error | null
    loading: boolean
    isDockerRunning: boolean
    getServiceUrl: (service: ServiceInfo) => string | null
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
        if (
            service.status !== 'running' ||
            !service.ports ||
            service.ports.length === 0 ||
            !['file', 'web'].some((type) => service.labels?.type?.includes(type))
        )
            return null

        const normalizedPorts = service.ports.map((port) => {
            if (typeof port === 'string') {
                const [published, target] = port.split(':')
                return {
                    published: parseInt(published),
                    target: parseInt(target)
                }
            }
            return port
        })

        // Fallback to first port with HTTP
        return `http://localhost:${normalizedPorts[0].published}`
    }

    useEffect(() => {
        if (error) {
            showErrorToast(error)
        }
    }, [error, showErrorToast])

    const loadComposeFile = useCallback(async (projectPath: string): Promise<void> => {
        const fileContent = await window.api.getFileContent(`${projectPath}/igrp-compose.yaml`)

        const composeConfig = yaml.load(fileContent) as DockerComposeConfig

        setFileContent(fileContent)
        setComposeConfig(composeConfig)
    }, [])

    useEffect(() => {
        const refreshContainers = async (): Promise<void> => {
            handleDockerOperation('status')
        }

        if (workspace && changeStatus) refreshContainers()
    }, [workspace, changeStatus, handleDockerOperation])

    return {
        fileContent,
        composeConfig,
        services,
        error,
        loading,
        isDockerRunning,
        getServiceUrl,
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
