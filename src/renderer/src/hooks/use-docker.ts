import { useState, useEffect, useCallback } from 'react';
import yaml from 'js-yaml';
import useToast from '@renderer/components/useToast';
import { DockerComposeConfig, DockerComposeService, ServiceInfo } from 'src/main/types';
import { useWorkspace } from './use-workspace';
import { IDocker } from 'src/main/interfaces';
import { useDispatch } from 'react-redux';
import { setChangeStatus } from '@renderer/redux/thunks';

export function useDocker() {
    const [isDockerRunning, setIsDockerRunning] = useState<boolean>(false);
    const {
        workspace,
    } = useWorkspace();

    const [fileContent, setFileContent] = useState<any>(null);
    const [services, setServices] = useState<ServiceInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [composeConfig, setComposeConfig] = useState<DockerComposeConfig | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const { showErrorToast } = useToast();
    const dispatch: any = useDispatch();

    const dockerOperations: IDocker = {
        up: async (projectPath: string) => {
            return window.igrpStudio.docker.up(projectPath);
        },
        down: async (projectPath: string) => {
            window.igrpStudio.docker.down(projectPath);
        },
        status: async (projectPath: string) => {
            return window.igrpStudio.docker.status(projectPath).then((services: ServiceInfo[]) => {
                setServices(services);
                return services;
            });
        },
        check: async () => {
            return window.igrpStudio.docker.check();
        },
        stop: async (projectPath: string, services: string[]) => {
            await window.igrpStudio.docker.stop(projectPath, services).then(() => {
                dispatch(setChangeStatus(true))
            })
        },
        restart: async (projectPath: string, services: string[], timeout?: number) => {
            await window.igrpStudio.docker.restart(projectPath, services, timeout).then(() => {
                dispatch(setChangeStatus(true))
            })
        }
    };

    const checkDocker = useCallback(async () => {
        try {
            const isRunning = await dockerOperations.check();
            setIsDockerRunning(isRunning);
            return isRunning;
        } catch (err) {
            setIsDockerRunning(false);
            return false;
        }
    }, []);


    const handleDockerOperation = useCallback(async (
        operation: keyof IDocker,
        services?: string[],
        timeout?: number
    ): Promise<DockerComposeService[] | boolean | void> => {
        setLoading(true);
        if (!isDockerRunning && operation !== 'status') {
            const isRunning = await checkDocker();
            if (!isRunning) {
                setLoading(false);
                setError(new Error('Docker daemon is not running'));
                throw new Error('Docker daemon is not running');
            }
        }

        try {
            return await dockerOperations[operation](workspace.path, services ?? [], timeout);
        } catch (err) {
            setError(err as Error);
            if (err instanceof Error &&
                (err.message.includes('ENOENT') || err.message.includes('docker.sock'))) {
                setIsDockerRunning(false);
                throw new Error('Docker daemon is not running');
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }, [isDockerRunning, dockerOperations]);

    const getServiceUrl = (service: ServiceInfo) => {
        if (service.status !== 'running' || !service.ports || service.ports.length === 0 || !['file', 'web'].some(type => service.type?.includes(type))) return null;

        const normalizedPorts = service.ports.map(port => {
            if (typeof port === 'string') {
                const [published, target] = port.split(':');
                return {
                    published: parseInt(published),
                    target: parseInt(target)
                };
            }
            return port;
        });

        // Fallback to first port with HTTP
        return `http://localhost:${normalizedPorts[0].published}`;
    };

    useEffect(() => {
        if (error) {
            showErrorToast(error)
        }
    }, [error]);

    const loadComposeFile = useCallback(async (projectPath: string): Promise<void> => {
        const fileContent = await window.api
            .getFileContent(`${projectPath}/igrp-compose.yaml`);

        const composeConfig = yaml.load(fileContent) as DockerComposeConfig;

        setFileContent(fileContent);
        setComposeConfig(composeConfig);
    }, [])

    useEffect(() => {
        const refreshContainers = async () => {
            if (workspace?.path) handleDockerOperation('status')
        };

        refreshContainers();
    }, [workspace]);

    return {
        fileContent,
        composeConfig,
        services,
        error,
        loading,
        getServiceUrl,
        loadComposeFile,
        startContainers: () => handleDockerOperation('up'),
        stopContainers: () => handleDockerOperation('down'),
        refreshContainers: () => handleDockerOperation('status'),
        stopService: (services?: string[]) => handleDockerOperation('stop', services),
        restartService: (services?: string[], timeout?: number) => handleDockerOperation('restart', services, timeout),
    };
}