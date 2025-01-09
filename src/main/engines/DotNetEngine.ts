// engines/DotNetEngine.ts
import { BaseApiConfig } from '../engine';
import { ProjectRepository } from '../repo/projects';
import { BaseEngine } from './BaseEngine';

export class DotNetEngine implements BaseEngine {
  async createApi(apiConfig: BaseApiConfig, basePath: string): Promise<void> {

    const repo = new ProjectRepository()

     await newApi(apiConfig, basePath);

    // Lógica específica do .NET
    console.log('Creating API for .NET');
    return await repo.save({
      path: basePath,
      dt_created: new Date(),
      location: 'local',
      config: {
        type: apiConfig.type,
        name: apiConfig.apiName,
        framework: apiConfig.framework, // Específico do .NET
        database: apiConfig.database,
        description: apiConfig.description,
        namespace: apiConfig.namespace,
      },
    });
  }
}