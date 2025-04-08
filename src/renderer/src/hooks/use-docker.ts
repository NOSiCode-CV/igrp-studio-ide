import { useState, useEffect, useCallback } from 'react';
import yaml from 'js-yaml';
import useToast from '@renderer/components/useToast';
import { DockerComposeConfig, DockerComposeService } from 'src/main/types';
import { useWorkspace } from './use-workspace';


export interface DockerOperations {
    up: (projectPath: string) => Promise<DockerComposeService[]>;
    down: (projectPath: string) => Promise<DockerComposeService[]>;
    status: (projectPath: string) => Promise<DockerComposeService[]>;
    check: () => Promise<boolean>;
}

export function useDocker() {
    const [isDockerRunning, setIsDockerRunning] = useState<boolean>(false);
    const {
        workspace,
    } = useWorkspace();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fileContent, setFileContent] = useState<any>(null);
    const [services, setServices] = useState<DockerComposeService[]>([]);

    const [composeConfig, setComposeConfig] = useState<DockerComposeConfig | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const { showErrorToast } = useToast();

    const dockerOperations: DockerOperations = {
        up: async (projectPath: string) => {
            if (!window.igrpStudio?.docker) throw new Error('Electron API not available');
            return window.igrpStudio.docker.up(projectPath);
        },
        down: async (projectPath: string) => {
            if (!window.igrpStudio?.docker) throw new Error('Electron API not available');
            return window.igrpStudio.docker.down(projectPath);
        },
        status: async (projectPath: string) => {
            if (!window.igrpStudio?.docker) throw new Error('Electron API not available');
            return window.igrpStudio.docker.status(projectPath).then((services: DockerComposeService[]) => {
                setServices(services);
                console.log("services", services)
                return services;
            })
        },
        check: async () => {
            if (!window.igrpStudio?.docker) return false;
            return window.igrpStudio.docker.check();
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
        operation: keyof DockerOperations,
        projectPath: string
    ): Promise<DockerComposeService[] | boolean> => {
        if (!isDockerRunning && operation !== 'status') {
            const isRunning = await checkDocker();
            if (!isRunning) {
                throw new Error('Docker daemon is not running');
            }
        }

        try {
            return await dockerOperations[operation](projectPath);
        } catch (err) {
            setError(err as Error);
            if (err instanceof Error &&
                (err.message.includes('ENOENT') || err.message.includes('docker.sock'))) {
                setIsDockerRunning(false);
                throw new Error('Docker daemon is not running');
            }
            throw err;
        }
    }, [isDockerRunning, checkDocker, dockerOperations]);

    const getServiceUrl = (service: DockerComposeService) => {
        if (service.status !== 'running' || !service.ports || service.ports.length === 0) return null;

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

        // Try to find the most likely web port
        const commonWebPorts = [80, 443, 3000, 8080, 8000, 9000, 9001];
        const webPort = normalizedPorts.find(p => commonWebPorts.includes(p.target));

        if (webPort) {
            const protocol = [443, 8443].includes(webPort.target) ? 'https' : 'http';
            return `${protocol}://localhost:${webPort.published}`;
        }

        // Try to guess protocol based on service image
        if (service.image?.includes('postgres') || service.image?.includes('redis') || webPort) {
            return null
        }

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
            if (workspace?.path) handleDockerOperation('status', workspace.path)
        };

        refreshContainers();
    }, [workspace]);

    return {
        fileContent,
        composeConfig,
        services,
        isLoading,
        error,
        getServiceUrl,
        loadComposeFile,
        startContainers: (projectPath: string) => handleDockerOperation('up', projectPath),
        stopContainers: (projectPath: string) => handleDockerOperation('down', projectPath),
        refreshContainers: (projectPath: string) => handleDockerOperation('status', projectPath),

    };
}