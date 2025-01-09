// engines/DotNetEngine.ts
import { BaseEngine } from '../interfaces';
import { ProjectRepository } from '../repo/projects';
import { BaseApiConfig } from '../types';

export class DotNetEngine implements BaseEngine {
  async createApi(apiConfig: BaseApiConfig, basePath: string): Promise<void> {

    const repo = new ProjectRepository()

    //await newApi(apiConfig, basePath);

    // Lógica específica do .NET
    console.log('Creating API for .NET');
    return await repo.save({
      path: basePath,
      dt_created: new Date(),
      location: 'local',
      config:apiConfig,
    });
  }
}