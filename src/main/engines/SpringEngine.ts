// engines/SpringEngine.ts
import { newApi } from '@igrp/spring-engine';
import { ProjectRepository } from '../repo/projects';
import { BaseApiConfig } from '../types';
import { BaseEngine } from '../interfaces';

export class SpringEngine implements BaseEngine {

  async createApi(apiConfig: BaseApiConfig, basePath: string): Promise<void> {

    const repo = new ProjectRepository()

    // Lógica específica do Spring
    await newApi(apiConfig, basePath);

    await repo.save({
      path: basePath,
      dt_created: new Date(),
      location: 'local',
      config: apiConfig,
    });
  }
}