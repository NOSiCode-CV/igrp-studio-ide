import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { DockerComposeConfig, DockerComposeService, ServiceInfo } from '../types';

const execAsync = promisify(exec);

export class DockerService {
    private composeCache: Record<string, DockerComposeConfig> = {};

    private escapePath(pathString: string): string {
        // Escape spaces and special characters in paths
        return `"${pathString.replace(/"/g, '\\"')}"`;
    }

    async loadComposeFile(projectPath: string): Promise<DockerComposeConfig> {
        const composePath = path.join(projectPath, 'igrp-compose.yaml');
        const fileContents = fs.readFileSync(composePath, 'utf8');
        this.composeCache[projectPath] = yaml.load(fileContents) as DockerComposeConfig;
        return this.composeCache[projectPath];
    }

    async executeComposeCommand(projectPath: string, command: string, service?: string): Promise<string> {
        const composeFile = path.join(projectPath, 'igrp-compose.yaml');
        const escapedComposeFile = this.escapePath(composeFile);
        const serviceParam = service || '';

        const envFilePath = path.join(projectPath, '.igrp.env');
        const escapedEnvFilePath = this.escapePath(envFilePath);


        if (!fs.existsSync(envFilePath)) {
            throw new Error(`Environment file not found: ${envFilePath}`);
        }

        try {
            const { stdout } = await execAsync(
                `docker compose -f ${escapedComposeFile} --env-file ${escapedEnvFilePath} ${command} ${serviceParam}`
                , {
                    maxBuffer: 1024 * 1024 * 10,
                });
            return stdout;
        } catch (error: any) {
            throw new Error(`Docker compose command failed: ${error.stderr || error.message}`);
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

    async down(projectPath: string): Promise<void> {
        try {
            await this.executeComposeCommand(projectPath, 'down --remove-orphans');
        } catch (error: any) {
            throw new Error(`Failed to stop containers: ${error.message}`);
        }
    }

    async status(projectPath: string): Promise<ServiceInfo[]> {
        try {
            // Load compose file first to get all services
            const compose = await this.loadComposeFile(projectPath);
            const allServices = compose.services;
            const serviceNames = Object.keys(allServices);

            try {
                // Get running containers
                const stdout = await this.executeComposeCommand(projectPath, 'ps --format json');
                const runningContainers = stdout.trim()
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => JSON.parse(line));

                // Create a map of running services for quick lookup
                const runningServicesMap = new Map(
                    runningContainers.map(container => [container.Service, container])
                );

                // Return all services with status info
                return serviceNames.map(serviceName => {
                    const serviceDef = allServices[serviceName];
                    const containerInfo = runningServicesMap.get(serviceName);

                    const { environment, depends_on, env_file, ...rest } = serviceDef

                    if (containerInfo) {
                        // Service is running
                        return {
                            ...rest,
                            name: serviceName,
                            status: containerInfo.State,
                            ports: containerInfo.Publishers?.map((p: any) => `${p.PublishedPort}:${p.TargetPort}`) || [],
                            volumes: serviceDef.volumes || [],
                            environments: this.parseEnvironmentToArray(serviceDef.environment),
                            createdAt: containerInfo.CreatedAt,
                            statusMessage: containerInfo.Status,
                            dependsOn: serviceDef.depends_on && !Array.isArray(serviceDef.depends_on) ? [serviceDef.depends_on] : serviceDef.depends_on || [],
                            env_file: env_file.map((file: string) => {
                                return { file }
                            }),
                        };
                    } else {
                        // Service is not running
                        return {
                            ...rest,
                            name: serviceName,
                            status: 'stopped',
                            dependsOn: serviceDef.depends_on && !Array.isArray(serviceDef.depends_on) ? [serviceDef.depends_on] : serviceDef.depends_on || [],
                            environments: this.parseEnvironmentToArray(serviceDef.environment),
                            env_file: env_file.map((file: string) => {
                                return { file }
                            }),
                        };
                    }
                });

            } catch (parseError) {
                console.error('Error parsing container info, returning compose services:', parseError);
                // Fallback to all services from compose file marked as not running
                return serviceNames.map(serviceName => {
                    const serviceDef = allServices[serviceName]
                    const { environment, depends_on, env_file, ...rest } = serviceDef
                    return (
                        {
                            ...rest,
                            name: serviceName,
                            status: 'error',
                            dependsOn: serviceDef.depends_on && !Array.isArray(serviceDef.depends_on) ? [serviceDef.depends_on] : serviceDef.depends_on || [],
                            environments: this.parseEnvironmentToArray(serviceDef.environment),
                            env_file: env_file.map((file: string) => {
                                return {file}
                            }),
                        }
                    )
                });
            }
        } catch (error: any) {
            console.error('Error getting status:', error);
            throw new Error(`Failed to get service status: ${error.message}`);
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
        env?: Record<string, string> | string[] | Array<{ name: string; value: string }>
    ): Array<{ name: string; value: string }> {
        if (!env) return [];

        // Handle array of {name, value} objects (already in correct format)
        if (Array.isArray(env) && env.length > 0 && typeof env[0] === 'object' && 'name' in env[0]) {
            return env as Array<{ name: string; value: string }>;
        }
        return []
    }

    async logs(projectPath: string, service?: string): Promise<string> {
        return this.executeComposeCommand(projectPath, 'logs --no-color', service);
    }

    async build(projectPath: string): Promise<void> {
        await this.executeComposeCommand(projectPath, 'build');
    }
}

export const dockerService = new DockerService();