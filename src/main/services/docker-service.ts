import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { DockerComposeConfig, ServiceInfo } from '../types';
import { escapePath } from '../helpers/utils';

const execAsync = promisify(exec);

export class DockerService {
    private composeCache: Record<string, DockerComposeConfig> = {};

    /**
     * Check if Docker daemon is running and accessible
     * @returns Promise<{isRunning: boolean, error?: string, details?: string}>
     */
    async checkDockerDaemon(): Promise<{
        isRunning: boolean;
        error?: string;
        details?: string;
    }> {
        try {
            // Try to get Docker info
            const { stdout } = await execAsync('docker info', {
                timeout: 10000, // 10 second timeout
                maxBuffer: 1024 * 1024, // 1MB buffer
            });

            // If we get here, Docker daemon is running
            return { isRunning: true, details: stdout };
        } catch (error: any) {
            const errorMessage = error.stderr || error.stdout || error.message;

            // Check for specific Docker daemon connection errors
            if (
                errorMessage.includes('Cannot connect to the Docker daemon') ||
                errorMessage.includes('docker.sock') ||
                errorMessage.includes('Connection refused')
            ) {
                return {
                    isRunning: false,
                    error: 'Docker daemon is not running',
                    details:
                        'Please start Docker Desktop or the Docker daemon service',
                };
            }

            // Check for Docker not installed
            if (
                errorMessage.includes('command not found') ||
                errorMessage.includes('docker: not found')
            ) {
                return {
                    isRunning: false,
                    error: 'Docker is not installed',
                    details: 'Please install Docker Desktop or Docker Engine',
                };
            }

            // Other errors
            return {
                isRunning: false,
                error: 'Docker daemon check failed',
                details: errorMessage,
            };
        }
    }

    /**
     * Check if Docker is available and running before executing commands
     * @throws Error if Docker daemon is not running
     */
    private async ensureDockerRunning(): Promise<void> {
        const check = await this.checkDockerDaemon();
        if (!check.isRunning) {
            throw new Error(
                `Docker daemon is not running: ${check.error}. ${check.details}`
            );
        }
    }

    async loadComposeFile(projectPath: string): Promise<DockerComposeConfig> {
        const composePath = path.join(projectPath, 'igrp-compose.yaml');
        const fileContents = fs.readFileSync(composePath, 'utf8');
        this.composeCache[projectPath] = yaml.load(
            fileContents
        ) as DockerComposeConfig;
        return this.composeCache[projectPath];
    }

    private prepareInitScript(projectPath: string): void {
        const igrpStudioPath = path.join(projectPath, '.igrpstudio');

        try {
            // Find all .sh files recursively
            const shFiles = this.findShFilesRecursively(igrpStudioPath);

            for (const scriptPath of shFiles) {
                // Read and normalize line endings
                let content = fs.readFileSync(scriptPath, 'utf8');
                content = content.replace(/\r\n/g, '\n');

                // Change shebang to #!/bin/sh for Alpine compatibility
                content = content.replace(/^#!\/bin\/bash/, '#!/bin/sh');

                fs.writeFileSync(scriptPath, content);

                // Set executable permissions
                if (process.platform !== 'win32') {
                    execSync(`chmod +x "${scriptPath}"`);
                }
            }
        } catch (error) {
            console.error('Error preparing init scripts:', error);
            throw error;
        }
    }

    private findShFilesRecursively(directory: string): string[] {
        const shFiles: string[] = [];

        const files = fs.readdirSync(directory);
        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                shFiles.push(...this.findShFilesRecursively(fullPath));
            } else if (file.endsWith('.sh')) {
                shFiles.push(fullPath);
            }
        }

        return shFiles;
    }

    async executeComposeCommand(
        projectPath: string,
        command: string,
        service?: string
    ): Promise<string> {
        // Check if Docker daemon is running first
        await this.ensureDockerRunning();

        const composeFile = path.join(projectPath, 'igrp-compose.yaml');
        const escapedComposeFile = escapePath(composeFile);
        const serviceParam = service || '';

        /*  const envFilePath = path.join(projectPath, '.igrp.env');
        const escapedEnvFilePath = escapePath(envFilePath); */

        // Prepare the init script first
        this.prepareInitScript(projectPath);

        /*  if (!fs.existsSync(envFilePath)) {
            throw new Error(`Environment file not found: ${envFilePath}`);
        } */

        try {
            const { stdout } = await execAsync(
                `docker compose -f ${escapedComposeFile}  ${command} ${serviceParam}`,
                {
                    maxBuffer: 1024 * 1024 * 10,
                }
            );
            return stdout;
        } catch (error: any) {
            // Check if the error is related to Docker daemon connection
            const errorMessage = error.stderr || error.message;
            if (
                errorMessage.includes('Cannot connect to the Docker daemon') ||
                errorMessage.includes('docker.sock') ||
                errorMessage.includes('Connection refused')
            ) {
                throw new Error(
                    `Docker daemon is not running. Please start Docker Desktop or the Docker daemon service.`
                );
            }
            throw new Error(`Docker compose command failed: ${errorMessage}`);
        }
    }

    async up(projectPath: string): Promise<void> {
        try {
            await this.executeComposeCommand(projectPath, `up -d --quiet-pull`);
            this.status(projectPath);
        } catch (error: any) {
            throw new Error(`Failed to start containers: ${error.message}`);
        }
    }

    async down(projectPath: string, dropVolume: boolean): Promise<void> {
        try {
            await this.executeComposeCommand(
                projectPath,
                `down --remove-orphans ${dropVolume && '-v'}`
            );
        } catch (error: any) {
            throw new Error(`Failed to stop containers: ${error.message}`);
        }
    }

    async status(projectPath: string): Promise<ServiceInfo[]> {
        try {
            // Load compose file first to get all services
            const compose = await this.loadComposeFile(projectPath);
            const allServices = compose.services;
            const volumes = compose.volumes;
            const serviceNames = Object.keys(allServices);

            try {
                // Check Docker daemon status first
                const dockerCheck = await this.checkDockerDaemon();
                if (!dockerCheck.isRunning) {
                    // Return all services as stopped with Docker daemon error
                    return serviceNames.map((serviceName) => {
                        const serviceDef = allServices[serviceName];
                        const { environment, depends_on, env_file, ...rest } =
                            serviceDef;
                        const processedVolumes = (serviceDef.volumes || []).map(
                            (volume) => {
                                if (typeof volume === 'string') {
                                    const [volumeName] = volume.split(':');
                                    const volumeConfig = volumes?.[volumeName];
                                    if (volumeConfig?.driver) {
                                        return `${volume}:${volumeConfig.driver}`;
                                    }
                                }
                                return volume;
                            }
                        );

                        return {
                            ...rest,
                            name: serviceName,
                            status: 'error',
                            statusMessage: `Docker daemon not running: ${dockerCheck.error}`,
                            dependsOn:
                                depends_on && !Array.isArray(depends_on)
                                    ? [depends_on]
                                    : depends_on || [],
                            environments:
                                this.parseEnvironmentToArray(environment),
                            env_file:
                                env_file &&
                                env_file.map((file: string) => ({ file })),
                            volumes: processedVolumes,
                        };
                    });
                }

                // Get running containers
                const stdout = await this.executeComposeCommand(
                    projectPath,
                    'ps --format json'
                );
                const runningContainers = stdout
                    .trim()
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((line) => JSON.parse(line));

                // Create a map of running services for quick lookup
                const runningServicesMap = new Map(
                    runningContainers.map((container) => [
                        container.Service,
                        container,
                    ])
                );

                // Return all services with status info
                return serviceNames.map((serviceName) => {
                    const serviceDef = allServices[serviceName];
                    const containerInfo = runningServicesMap.get(serviceName);

                    const { environment, depends_on, env_file, ...rest } =
                        serviceDef;
                    // Process volumes with driver information
                    const processedVolumes = (serviceDef.volumes || []).map(
                        (volume) => {
                            if (typeof volume === 'string') {
                                // For named volumes (format "volume_name:container_path")
                                const [volumeName] = volume.split(':');

                                // Check if we have driver info for this volume
                                const volumeConfig = volumes?.[volumeName];
                                if (volumeConfig?.driver) {
                                    return `${volume}:${volumeConfig.driver}`;
                                }
                            }
                            return volume;
                        }
                    );

                    if (containerInfo) {
                        // Service is running
                        return {
                            ...rest,
                            name: serviceName,
                            status: containerInfo.State,
                            ports:
                                containerInfo.Publishers?.map(
                                    (p: any) =>
                                        `${p.PublishedPort}:${p.TargetPort}`
                                ) || [],
                            volumes: processedVolumes,
                            environments:
                                this.parseEnvironmentToArray(environment),
                            createdAt: containerInfo.CreatedAt,
                            statusMessage: containerInfo.Status,
                            dependsOn:
                                depends_on && !Array.isArray(depends_on)
                                    ? [depends_on]
                                    : depends_on || [],
                            env_file:
                                env_file &&
                                env_file.map((file: string) => {
                                    return { file };
                                }),
                        };
                    } else {
                        // Service is not running
                        return {
                            ...rest,
                            name: serviceName,
                            status: 'stopped',
                            dependsOn:
                                depends_on && !Array.isArray(depends_on)
                                    ? [depends_on]
                                    : depends_on || [],
                            environments:
                                this.parseEnvironmentToArray(environment),
                            env_file:
                                env_file &&
                                env_file.map((file: string) => {
                                    return { file };
                                }),
                            volumes: processedVolumes,
                        };
                    }
                });
            } catch (parseError) {
                console.error(
                    'Error parsing container info, returning compose services:',
                    parseError
                );
                // Fallback to all services from compose file marked as not running
                return serviceNames.map((serviceName) => {
                    const serviceDef = allServices[serviceName];
                    const { environment, depends_on, env_file, ...rest } =
                        serviceDef;
                    return {
                        ...rest,
                        name: serviceName,
                        status: 'error',
                        dependsOn:
                            serviceDef.depends_on &&
                            !Array.isArray(serviceDef.depends_on)
                                ? [serviceDef.depends_on]
                                : serviceDef.depends_on || [],
                        environments: this.parseEnvironmentToArray(
                            serviceDef.environment
                        ),
                        env_file:
                            env_file &&
                            env_file.map((file: string) => {
                                return { file };
                            }),
                    };
                });
            }
        } catch (error: any) {
            console.error('Error getting status:', error);
            return [];
        }
    }

    /**
     * Stop specific services (containers remain but are stopped)
     * @param projectPath Path to the project
     * @param services Array of service names to stop
     */
    async stop(projectPath: string, services: string[]): Promise<void> {
        try {
            await this.executeComposeCommand(
                projectPath,
                `stop ${services.join(' ')}`
            );
        } catch (error: any) {
            throw new Error(`Failed to stop services: ${error.message}`);
        }
    }

    /**
     * Restart specific services
     * @param projectPath Path to the project
     * @param services Array of service names to restart
     * @param timeout Optional timeout in seconds for shutdown
     */
    async restart(
        projectPath: string,
        services: string[],
        timeout?: number
    ): Promise<void> {
        try {
            const timeoutFlag = timeout ? `--timeout ${timeout}` : '';
            await this.executeComposeCommand(
                projectPath,
                `restart ${timeoutFlag} ${services.join(' ')}`
            );
        } catch (error: any) {
            throw new Error(`Failed to restart services: ${error.message}`);
        }
    }

    private parseEnvironmentToArray(
        env?: string[] | Array<{ key: string; value: string }>
    ): Array<{ key: string; value: string }> {
        if (!env) return [];

        // Case 1: Already in correct format (array of {name, value} objects)
        if (env.length > 0 && typeof env[0] === 'object' && 'name' in env[0]) {
            return env as Array<{ key: string; value: string }>;
        }

        // Case 2: Array of strings in "KEY=VALUE" format (including ${VARIABLE} syntax)
        if (env.length > 0 && typeof env[0] === 'string') {
            return (env as string[]).map((item) => {
                const [name, ...valueParts] = item.split('=');
                const value = valueParts.join('='); // Handle values containing '='

                // Preserve the ${VARIABLE} syntax in the value
                return {
                    key: name.trim(),
                    value: value.trim(),
                };
            });
        }

        return [];
    }

    async logs(projectPath: string, service?: string): Promise<string> {
        return this.executeComposeCommand(
            projectPath,
            'logs --no-color',
            service
        );
    }

    async build(projectPath: string): Promise<void> {
        await this.executeComposeCommand(projectPath, 'build');
    }
}

export const dockerService = new DockerService();
