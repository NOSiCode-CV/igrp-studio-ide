// engines/SpringEngine.ts
import { newApi } from '@igrp/spring-engine';
import { BaseEngine } from './BaseEngine';
import { ProjectRepository } from '../repo/projects';
import { BaseApiConfig } from '../engine';

export class SpringEngine implements BaseEngine {

  async createApi(apiConfig: BaseApiConfig, basePath: string): Promise<void> {

    const repo = new ProjectRepository()

    // Lógica específica do Spring
    await newApi(apiConfig, basePath);

    await repo.save({
      path: basePath,
      dt_created: new Date(),
      location: 'local',
      config: {
        type: apiConfig.type,
        name: apiConfig.apiName,
        group: apiConfig.group,
        artifact: apiConfig.artifact,
        database: apiConfig.database,
        description: apiConfig.description,
        package: apiConfig.package,
      },
    });
  }
}