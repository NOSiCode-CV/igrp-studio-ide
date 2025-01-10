// engines/SpringEngine.ts
import { addResponse, deleteElement, newApi } from '@igrp/spring-engine';
import { ProjectRepository } from '../repo/projects';
import { BaseEngine } from '../interfaces';
import { BaseApiConfig, DeleteConfig, ResponseConfig } from '@igrp/spring-engine/dist/interfaces/types';

export class SpringEngine implements BaseEngine {

  async delete(config: DeleteConfig, basePath: string): Promise<void> {
    await deleteElement(config, basePath)
  }

  async createApi(apiConfig: BaseApiConfig, basePath: string): Promise<void> {

    const repo = new ProjectRepository()

    const config = {
      ...apiConfig,
      type: 'baseApi'
    }

    // Lógica específica do Spring
    await newApi(config, basePath);

    await repo.save({
      path: basePath,
      dt_created: new Date(),
      location: 'local',
      config: { ...config, name: config.apiName },
    });
  }

  async createResponse(config: ResponseConfig, basePath: string): Promise<void> {
    await addResponse(config, basePath);
  }
}