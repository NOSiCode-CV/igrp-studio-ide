import Docker, { ContainerInfo as DockerContainerInfo } from 'dockerode';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { DockerComposeConfig, ContainerInfo, DockerComposeService } from './types';

export class DockerService {
    private docker: Docker;
    private composeCache: Record<string, DockerComposeConfig> = {};

    constructor() {
        this.docker = new Docker();
    }

    async loadComposeFile(projectPath: string): Promise<DockerComposeConfig> {
        const composePath = path.join(projectPath, 'igrp-compose.yaml');
        const fileContents = fs.readFileSync(composePath, 'utf8');
        this.composeCache[projectPath] = yaml.load(fileContents) as DockerComposeConfig;
        return this.composeCache[projectPath];
    }

    async up(projectPath: string): Promise<ContainerInfo[]> {
        const compose = await this.loadComposeFile(projectPath);
        const services = Object.keys(compose.services);

        const results: ContainerInfo[] = [];
        for (const serviceName of services) {
            const service = compose.services[serviceName];
            const container = await this.createContainer(serviceName, service, projectPath);
            await container.start();
            results.push({
                name: serviceName,
                id: container.id,
                status: 'started',
                image: service.image
            });
        }

        return results;
    }

    async down(projectPath: string): Promise<ContainerInfo[]> {
        const compose = await this.loadComposeFile(projectPath);
        const services = Object.keys(compose.services);

        const results: ContainerInfo[] = [];
        for (const serviceName of services) {
            const containers = await this.docker.listContainers({
                all: true,
                filters: JSON.stringify({
                    name: [serviceName]
                })
            });

            for (const containerInfo of containers) {
                const container = this.docker.getContainer(containerInfo.Id);
                await container.stop();
                await container.remove();
                results.push({
                    name: serviceName,
                    id: containerInfo.Id,
                    status: 'stopped',
                    image: containerInfo.Image
                });
            }
        }

        return results;
    }

    async status(projectPath: string): Promise<ContainerInfo[]> {
        const compose = await this.loadComposeFile(projectPath);
        const services = Object.keys(compose.services);

        const results: ContainerInfo[] = [];
        for (const serviceName of services) {
            const containers = await this.docker.listContainers({
                all: true,
                filters: JSON.stringify({
                    name: [serviceName]
                })
            });

            for (const containerInfo of containers) {
                results.push({
                    name: serviceName,
                    id: containerInfo.Id,
                    status: containerInfo.State,
                    image: containerInfo.Image,
                    ports: containerInfo.Ports?.map(p => `${p.PublicPort}:${p.PrivatePort}`)
                });
            }
        }

        return results;
    }

    private async createContainer(
        serviceName: string,
        serviceDef: DockerComposeService,
        projectPath: string
    ) {
        const options = {
            name: serviceName,
            Image: serviceDef.image,
            Env: Object.entries(serviceDef.environment || {}).map(([k, v]) => `${k}=${v}`),
            HostConfig: {
                PortBindings: this.parsePorts(serviceDef.ports || []),
                Binds: this.parseVolumes(serviceDef.volumes || [], projectPath)
            }
        };

        return this.docker.createContainer(options);
    }

    private parsePorts(ports: string[]): Record<string, { HostPort: string }[]> {
        const result: Record<string, { HostPort: string }[]> = {};
        ports.forEach(portDef => {
            const [hostPort, containerPort] = portDef.split(':');
            result[`${containerPort}/tcp`] = [{ HostPort: hostPort }];
        });
        return result;
    }

    private parseVolumes(volumes: string[], projectPath: string): string[] {
        return volumes.map(volume => {
            const [hostPath, containerPath] = volume.split(':');
            return path.isAbsolute(hostPath)
                ? volume
                : `${path.join(projectPath, hostPath)}:${containerPath}`;
        });
    }
}

export const dockerService = new DockerService();