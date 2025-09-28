import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { DockerComposeConfig, ServiceInfo } from '../types';
import { escapePath } from '../helpers/utils';
import { BrowserWindow } from 'electron';
import { EVENTS } from '../constants/events';

const execAsync = promisify(exec);

export class DockerService {
    private composeCache: Record<string, DockerComposeConfig> = {};

    /**
     * Test logging functionality
     */
    testLogging(): void {
        this.logInfo('Testing Docker service logging...');
        this.logSuccess('Docker service logging is working!');
        this.logWarn('This is a warning message');
        this.logDebug('This is a debug message');
        this.logError('This is an error message (for testing)');
    }

    /**
     * Send log message to renderer process
     */
    private log(
        level: 'info' | 'warn' | 'error' | 'debug' | 'success',
        message: string,
        progress?: { current: number; total: number; label?: string }
    ): void {
        const logMessage = {
            code: 'docker-service',
            message,
            level,
            timestamp: new Date().toISOString(),
            progress,
        };

        // Also log to console for debugging
        console.log(`[DockerService ${level.toUpperCase()}] ${message}`);

        // Send to all renderer processes
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((window) => {
            if (!window.isDestroyed()) {
                window.webContents.send(EVENTS.LOG, logMessage);
            }
        });
    }

    /**
     * Log info message
     */
    private logInfo(message: string): void {
        this.log('info', message);
    }

    /**
     * Log warning message
     */
    private logWarn(message: string): void {
        this.log('warn', message);
    }

    /**
     * Log error message
     */
    private logError(message: string): void {
        this.log('error', message);
    }

    /**
     * Log debug message
     */
    private logDebug(message: string): void {
        this.log('debug', message);
    }

    /**
     * Log success message
     */
    private logSuccess(message: string): void {
        this.log('success', message);
    }

    /**
     * Log progress update
     */
    private logProgress(current: number, total: number, label: string): void {
        this.log('info', `${label}: ${current}/${total}`, {
            current,
            total,
            label,
        });
    }

    /**
     * Simulate progress for long-running operations
     */
    private async simulateProgress<T>(
        operation: () => Promise<T>,
        label: string,
        totalSteps: number = 10
    ): Promise<T> {
        let currentStep = 0;
        const stepInterval = 1000; // 1 second per step

        // Start progress simulation
        const progressInterval = setInterval(() => {
            if (currentStep < totalSteps) {
                currentStep += 1;
                this.logProgress(currentStep, totalSteps, label);
            }
        }, stepInterval);

        try {
            const result = await operation();

            // Complete progress
            clearInterval(progressInterval);
            this.logProgress(totalSteps, totalSteps, `${label} completed`);

            return result;
        } catch (error) {
            clearInterval(progressInterval);
            this.logError(
                `${label} failed at step ${currentStep}/${totalSteps}`
            );
            throw error;
        }
    }

    /**
     * Check if Docker daemon is running and accessible
     * @returns Promise<{isRunning: boolean, error?: string, details?: string}>
     */
    async checkDockerDaemon(): Promise<{
        isRunning: boolean;
        error?: string;
        details?: string;
    }> {
        this.logInfo('Checking Docker daemon status...');

        try {
            // Ensure proper environment for exec with common paths for all platforms
            const getDefaultPath = () => {
                if (process.platform === 'win32') {
                    return 'C:\\Program Files\\Docker\\Docker\\resources\\bin;C:\\Program Files\\Git\\bin;C:\\Program Files\\nodejs;C:\\Windows\\System32;C:\\Windows';
                } else if (process.platform === 'darwin') {
                    return '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin';
                } else {
                    return '/usr/local/bin:/usr/bin:/bin:/snap/bin';
                }
            };

            // Try to get Docker info
            const { stdout } = await execAsync('docker info', {
                env: {
                    ...process.env,
                    PATH: process.env.PATH || getDefaultPath(),
                },
                shell: true,
                timeout: 10000, // 10 second timeout
                maxBuffer: 1024 * 1024, // 1MB buffer
            });

            this.logSuccess('Docker daemon is running and accessible');
            this.logDebug(`Docker info: ${stdout.substring(0, 200)}...`);

            // If we get here, Docker daemon is running
            return { isRunning: true, details: stdout };
        } catch (error: unknown) {
            const errorMessage =
                (error as any).stderr ||
                (error as any).stdout ||
                (error as any).message;
            this.logError(`Docker daemon check failed: ${errorMessage}`);

            // Check for specific Docker daemon connection errors
            if (
                errorMessage.includes('Cannot connect to the Docker daemon') ||
                errorMessage.includes('docker.sock') ||
                errorMessage.includes('Connection refused')
            ) {
                this.logError('Docker daemon is not running');
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
                this.logError('Docker is not installed');
                return {
                    isRunning: false,
                    error: 'Docker is not installed',
                    details: 'Please install Docker Desktop or Docker Engine',
                };
            }

            // Other errors
            this.logError(`Docker daemon check failed: ${errorMessage}`);
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
        this.logDebug('Ensuring Docker daemon is running...');
        const check = await this.checkDockerDaemon();
        if (!check.isRunning) {
            this.logError(
                `Docker daemon is not running: ${check.error}. ${check.details}`
            );
            throw new Error(
                `Docker daemon is not running: ${check.error}. ${check.details}`
            );
        }
        this.logDebug('Docker daemon is confirmed to be running');
    }

    async loadComposeFile(projectPath: string): Promise<DockerComposeConfig> {
        this.logInfo(`Loading Docker Compose file from: ${projectPath}`);
        const composePath = path.join(projectPath, 'igrp-compose.yaml');

        try {
            const fileContents = fs.readFileSync(composePath, 'utf8');
            this.logDebug(
                `Compose file size: ${fileContents.length} characters`
            );

            this.composeCache[projectPath] = yaml.load(
                fileContents
            ) as DockerComposeConfig;

            const serviceCount = Object.keys(
                this.composeCache[projectPath].services || {}
            ).length;
            this.logSuccess(
                `Successfully loaded compose file with ${serviceCount} services`
            );

            return this.composeCache[projectPath];
        } catch (error: unknown) {
            this.logError(
                `Failed to load compose file: ${(error as any).message}`
            );
            throw error;
        }
    }

    private prepareInitScript(projectPath: string): void {
        this.logInfo('Preparing initialization scripts...');
        const igrpStudioPath = path.join(projectPath, '.igrpstudio');

        try {
            // Find all .sh files recursively
            const shFiles = this.findShFilesRecursively(igrpStudioPath);
            this.logDebug(`Found ${shFiles.length} shell scripts to prepare`);

            if (shFiles.length === 0) {
                this.logWarn('No shell scripts found in .igrpstudio directory');
                return;
            }

            for (let i = 0; i < shFiles.length; i++) {
                const scriptPath = shFiles[i];
                this.logProgress(
                    i + 1,
                    shFiles.length,
                    `Preparing script: ${path.basename(scriptPath)}`
                );

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

                this.logDebug(`Prepared script: ${scriptPath}`);
            }

            this.logSuccess(
                `Successfully prepared ${shFiles.length} initialization scripts`
            );
        } catch (error: unknown) {
            this.logError(`Error preparing init scripts: ${error}`);
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
        this.logInfo(
            `Executing Docker Compose command: ${command}${service ? ` for service: ${service}` : ''}`
        );

        // Check if Docker daemon is running first
        await this.ensureDockerRunning();

        const composeFile = path.join(projectPath, 'igrp-compose.yaml');
        const escapedComposeFile = escapePath(composeFile);
        const serviceParam = service || '';

        this.logDebug(`Compose file: ${composeFile}`);
        this.logDebug(`Service parameter: ${serviceParam || 'all services'}`);

        // Prepare the init script first
        this.prepareInitScript(projectPath);

        const fullCommand =
            `docker compose -f ${escapedComposeFile} ${command} ${serviceParam}`.trim();
        this.logDebug(`Full command: ${fullCommand}`);

        // Check if this is a pull command for progress tracking
        const isPullCommand =
            command.includes('pull') || command.includes('up');
        const isBuildCommand = command.includes('build');

        try {
            this.logInfo('Starting Docker Compose execution...');
            const startTime = Date.now();

            if (isPullCommand) {
                this.logInfo('Pulling Docker images...');
                this.logProgress(0, 100, 'Pulling images');
            } else if (isBuildCommand) {
                this.logInfo('Building Docker images...');
                this.logProgress(0, 100, 'Building images');
            }

            // Ensure proper environment for exec with common paths for all platforms
            const getDefaultPath = () => {
                if (process.platform === 'win32') {
                    return 'C:\\Program Files\\Docker\\Docker\\resources\\bin;C:\\Program Files\\Git\\bin;C:\\Program Files\\nodejs;C:\\Windows\\System32;C:\\Windows';
                } else if (process.platform === 'darwin') {
                    return '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin';
                } else {
                    return '/usr/local/bin:/usr/bin:/bin:/snap/bin';
                }
            };

            const { stdout } = await execAsync(fullCommand, {
                env: {
                    ...process.env,
                    PATH: process.env.PATH || getDefaultPath(),
                },
                shell: true,
                maxBuffer: 1024 * 1024 * 10,
            });

            const duration = Date.now() - startTime;

            if (isPullCommand) {
                this.logProgress(100, 100, 'Images pulled successfully');
                this.logSuccess(
                    `Docker images pulled successfully in ${duration}ms`
                );
            } else if (isBuildCommand) {
                this.logProgress(100, 100, 'Images built successfully');
                this.logSuccess(
                    `Docker images built successfully in ${duration}ms`
                );
            } else {
                this.logSuccess(
                    `Docker Compose command completed successfully in ${duration}ms`
                );
            }

            this.logDebug(`Command output length: ${stdout.length} characters`);

            return stdout;
        } catch (error: unknown) {
            const duration = Date.now() - (Date.now() - 1000); // Approximate duration
            const errorMessage =
                (error as any).stderr || (error as any).message;

            if (isPullCommand) {
                this.logError(
                    `Docker pull failed after ${duration}ms: ${errorMessage}`
                );
            } else if (isBuildCommand) {
                this.logError(
                    `Docker build failed after ${duration}ms: ${errorMessage}`
                );
            } else {
                this.logError(
                    `Docker Compose command failed after ${duration}ms: ${errorMessage}`
                );
            }

            // Check if the error is related to Docker daemon connection
            if (
                errorMessage.includes('Cannot connect to the Docker daemon') ||
                errorMessage.includes('docker.sock') ||
                errorMessage.includes('Connection refused')
            ) {
                this.logError(
                    'Docker daemon connection lost during command execution'
                );
                throw new Error(
                    `Docker daemon is not running. Please start Docker Desktop or the Docker daemon service.`
                );
            }

            this.logError(`Docker compose command failed: ${errorMessage}`);
            throw new Error(`Docker compose command failed: ${errorMessage}`);
        }
    }

    async up(projectPath: string): Promise<void> {
        this.logInfo('Starting Docker Compose services...');
        try {
            // Use progress simulation for the up command which includes pulling
            await this.simulateProgress(
                () =>
                    this.executeComposeCommand(
                        projectPath,
                        `up -d --quiet-pull`
                    ),
                'Starting services and pulling images',
                15 // 15 steps for a typical up operation
            );

            this.logSuccess('Docker Compose services started successfully');
            this.logInfo('Checking service status...');
            await this.status(projectPath);
        } catch (error: unknown) {
            this.logError(
                `Failed to start containers: ${(error as any).message}`
            );
            throw new Error(
                `Failed to start containers: ${(error as any).message}`
            );
        }
    }

    async down(projectPath: string, dropVolume: boolean): Promise<void> {
        this.logInfo(
            `Stopping Docker Compose services${dropVolume ? ' and removing volumes' : ''}...`
        );
        try {
            await this.executeComposeCommand(
                projectPath,
                `down --remove-orphans ${dropVolume && '-v'}`
            );
            this.logSuccess(
                `Docker Compose services stopped successfully${dropVolume ? ' and volumes removed' : ''}`
            );
        } catch (error: unknown) {
            this.logError(
                `Failed to stop containers: ${(error as any).message}`
            );
            throw new Error(
                `Failed to stop containers: ${(error as any).message}`
            );
        }
    }

    async status(projectPath: string): Promise<ServiceInfo[]> {
        this.logInfo('Checking Docker Compose service status...');
        try {
            // Load compose file first to get all services
            const compose = await this.loadComposeFile(projectPath);
            const allServices = compose.services;
            const volumes = compose.volumes;
            const serviceNames = Object.keys(allServices);
            this.logDebug(
                `Found ${serviceNames.length} services in compose file: ${serviceNames.join(', ')}`
            );

            try {
                // Check Docker daemon status first
                const dockerCheck = await this.checkDockerDaemon();
                if (!dockerCheck.isRunning) {
                    this.logWarn(
                        'Docker daemon not running, returning error status for all services'
                    );
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
                this.logDebug('Querying running containers...');
                const stdout = await this.executeComposeCommand(
                    projectPath,
                    'ps --format json'
                );
                const runningContainers = stdout
                    .trim()
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((line) => JSON.parse(line));

                this.logDebug(
                    `Found ${runningContainers.length} running containers`
                );

                // Create a map of running services for quick lookup
                const runningServicesMap = new Map(
                    runningContainers.map((container) => [
                        container.Service,
                        container,
                    ])
                );

                // Return all services with status info
                const serviceInfo = serviceNames.map((serviceName) => {
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

                this.logSuccess(
                    `Status check completed for ${serviceNames.length} services`
                );
                return serviceInfo;
            } catch (parseError) {
                this.logError(`Error parsing container info: ${parseError}`);
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
                            depends_on && !Array.isArray(depends_on)
                                ? [depends_on]
                                : depends_on || [],
                        environments: this.parseEnvironmentToArray(environment),
                        env_file:
                            env_file &&
                            env_file.map((file: string) => {
                                return { file };
                            }),
                    };
                });
            }
        } catch (error: unknown) {
            this.logError(`Error getting status: ${(error as any).message}`);
            return [];
        }
    }

    /**
     * Stop specific services (containers remain but are stopped)
     * @param projectPath Path to the project
     * @param services Array of service names to stop
     */
    async stop(projectPath: string, services: string[]): Promise<void> {
        this.logInfo(`Stopping services: ${services.join(', ')}`);
        try {
            await this.executeComposeCommand(
                projectPath,
                `stop ${services.join(' ')}`
            );
            this.logSuccess(
                `Successfully stopped services: ${services.join(', ')}`
            );
        } catch (error: unknown) {
            this.logError(`Failed to stop services: ${(error as any).message}`);
            throw new Error(
                `Failed to stop services: ${(error as any).message}`
            );
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
        this.logInfo(
            `Restarting services: ${services.join(', ')}${timeout ? ` with ${timeout}s timeout` : ''}`
        );
        try {
            const timeoutFlag = timeout ? `--timeout ${timeout}` : '';
            await this.executeComposeCommand(
                projectPath,
                `restart ${timeoutFlag} ${services.join(' ')}`
            );
            this.logSuccess(
                `Successfully restarted services: ${services.join(', ')}`
            );
        } catch (error: unknown) {
            this.logError(
                `Failed to restart services: ${(error as any).message}`
            );
            throw new Error(
                `Failed to restart services: ${(error as any).message}`
            );
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
        this.logInfo(
            `Retrieving logs${service ? ` for service: ${service}` : ' for all services'}`
        );
        try {
            const logs = await this.executeComposeCommand(
                projectPath,
                'logs --no-color',
                service
            );
            this.logSuccess(
                `Successfully retrieved logs${service ? ` for ${service}` : ''}`
            );
            return logs;
        } catch (error: unknown) {
            this.logError(`Failed to retrieve logs: ${(error as any).message}`);
            throw error;
        }
    }

    async build(projectPath: string): Promise<void> {
        this.logInfo('Building Docker Compose services...');
        try {
            // Use progress simulation for build operations
            await this.simulateProgress(
                () => this.executeComposeCommand(projectPath, 'build'),
                'Building Docker images',
                20 // 20 steps for a typical build operation
            );

            this.logSuccess('Docker Compose services built successfully');
        } catch (error: unknown) {
            this.logError(
                `Failed to build services: ${(error as any).message}`
            );
            throw error;
        }
    }

    /**
     * Pull Docker images with progress tracking
     */
    async pull(projectPath: string): Promise<void> {
        this.logInfo('Pulling Docker images...');
        try {
            // Use progress simulation for pull operations
            await this.simulateProgress(
                () => this.executeComposeCommand(projectPath, 'pull'),
                'Pulling Docker images',
                25 // 25 steps for a typical pull operation
            );

            this.logSuccess('Docker images pulled successfully');
        } catch (error: unknown) {
            this.logError(`Failed to pull images: ${(error as any).message}`);
            throw error;
        }
    }
}

export const dockerService = new DockerService();
