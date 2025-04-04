import { useState, useEffect, useCallback } from 'react';
import yaml from 'js-yaml';
import useToast from '@renderer/components/useToast';


interface ContainerInfo {
    id: string;
    name: string;
    status: string;
    image: string;
    ports?: string[];
}


interface DockerComposeService {
    image: string;
    ports?: string[];
    volumes?: string[];
    environment?: Record<string, string>;
}

interface DockerComposeConfig {
    version: string;
    services: Record<string, DockerComposeService>;
}

interface UseDockerReturn {
    containers: ContainerInfo[];
    fileContent: string | null;
    composeConfig: DockerComposeConfig | null;
    services: string[];
    isLoading: boolean;
    error: Error | null;
    loadComposeFile: (projectPath: string) => Promise<void>;
    startContainers: (projectPath: string) => Promise<void>;
    stopContainers: (projectPath: string) => Promise<void>;
    refreshContainers: (projectPath: string) => Promise<void>;
}

export function useDocker(): UseDockerReturn {
    const [isDockerRunning, setIsDockerRunning] = useState<boolean>(false);

    const [containers, setContainers] = useState<ContainerInfo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fileContent, setFileContent] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);

    const [composeConfig, setComposeConfig] = useState<DockerComposeConfig | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const { showErrorToast } = useToast();

    const checkDocker = useCallback(async (): Promise<boolean> => {
        try {
            if (window.electron) {
                const isRunning = await window.electron.ipcRenderer.invoke('docker-check');
                setIsDockerRunning(isRunning);
                return isRunning;
            }
            // For web implementation, you would check via API
            return false;
        } catch (err) {
            setIsDockerRunning(false);
            return false;
        }
    }, []);

    const handleDockerOperation = useCallback(async (
        operation: 'up' | 'down' | 'status',
        projectPath: string
    ): Promise<ContainerInfo[]> => {
        if (!isDockerRunning) {
            const isRunning = await checkDocker();
            if (!isRunning) {
                throw new Error('Docker daemon is not running');
            }
        }

        try {
            if (window.electron) {
                return await window.electron.ipcRenderer.invoke(`docker-${operation}`, projectPath);
            }
            // Web implementation would use fetch here
            throw new Error('Not implemented for web');
        } catch (err) {
            if (err.message.includes('ENOENT') || err.message.includes('docker.sock')) {
                setIsDockerRunning(false);
                throw new Error('Docker daemon is not running');
            }
            throw err;
        }
    }, [isDockerRunning, checkDocker]);

    const refreshContainers = async (projectPath: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await handleDockerOperation('status', projectPath);
            setContainers(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to refresh containers'));
        } finally {
            setIsLoading(false);
        }
    };

    const startContainers = async (projectPath: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await handleDockerOperation('up', projectPath);
            setContainers(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to start containers'));
        } finally {
            setIsLoading(false);
        }
    };

    const stopContainers = async (projectPath: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await handleDockerOperation('down', projectPath);
            setContainers(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to stop containers'));
        } finally {
            setIsLoading(false);
        }
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

        const services = Object.keys(composeConfig.services);

        setFileContent(fileContent);
        setComposeConfig(composeConfig);
        setServices(services);
    }, [])

    return {
        containers,
        fileContent,
        composeConfig,
        services,
        isLoading,
        error,
        loadComposeFile,
        startContainers,
        stopContainers,
        refreshContainers,
    };
}