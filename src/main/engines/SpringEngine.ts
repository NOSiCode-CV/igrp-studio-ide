// engines/SpringEngine.ts
import { addResponse, deleteElement, newApi } from '@igrp/spring-engine';
import { ProjectRepository } from '../repo/projects';
import { BaseEngine } from '../interfaces';
import { BaseApiConfig, DeleteConfig, ResponseConfig } from '@igrp/spring-engine/dist/interfaces/types';
import { ProjectData } from '../types';

export class SpringEngine implements BaseEngine {

  async delete(config: DeleteConfig, basePath: string): Promise<void> {
    await deleteElement(config, basePath)
  }

  async createProject(project: ProjectData, basePath: string): Promise<void> {

    const repo = new ProjectRepository()

    const config: BaseApiConfig = {
      ...project.config,
      type: project.framework
    }

    // Lógica específica do Spring
    await newApi(config, basePath);

    await repo.save({
      ...project,
      path: basePath,
      dt_created: new Date(),
      location: 'local'
    });
  }

  async createResponse(config: ResponseConfig, basePath: string): Promise<void> {
    await addResponse(config, basePath);
  }
}