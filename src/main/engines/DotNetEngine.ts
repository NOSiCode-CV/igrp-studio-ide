// engines/DotNetEngine.ts
import { newApi } from '@igrp/dotnet-engine';
import { BaseEngine } from '../interfaces';
import { ProjectRepository } from '../repo/projects';
import { BaseApiConfig, ResponseConfig } from '@igrp/dotnet-engine/dist/interfaces/types';

export class DotNetEngine implements BaseEngine {
  createResponse(config: ResponseConfig, basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async createApi(apiConfig: BaseApiConfig, basePath: string): Promise<void> {

    const repo = new ProjectRepository()

    const config = {
      ...apiConfig,
      type: 'dotnet'
    }

    await newApi(config, basePath);

    return await repo.save({
      path: basePath,
      dt_created: new Date(),
      location: 'local',
      config: { ...config, name: config.apiName },
    });
  }
}