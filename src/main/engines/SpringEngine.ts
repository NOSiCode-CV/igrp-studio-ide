// engines/SpringEngine.ts
import { addEnum, addResponse, deleteElement, newApi, serializeElement as createElement, addDTO, addModule, addModel, addController, getSpringDependencies } from '@igrp/igrp-studio-springboot-engine';
import { BaseEngine } from '../interfaces';
import { BaseApiConfig, ControllerConfig, DeleteConfig, DTOConfig, EnumConfig, ModelConfig, ModuleConfig, ResponseConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { ProjectData, SpringConfigData } from '../types';
import { Dependency } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/springDependencyTypes';
import { ensureDirectoryExists } from '../helpers';

export class SpringEngine implements BaseEngine {

  async getDependencies(): Promise<Dependency[]> {
    return await getSpringDependencies()
  }

  async createController(config: ControllerConfig, basePath: string): Promise<void> {
    await addController(config, basePath)
  }

  async createModel(config: ModelConfig, basePath: string): Promise<void> {
    await addModel(config, basePath)
  }

  async createModule(config: ModuleConfig, basePath: string): Promise<void> {
    await addModule(config, basePath)
  }

  async createDto(config: DTOConfig, basePath: string): Promise<void> {
    await addDTO(config, basePath)
  }

  async createPermission(_data: any, _basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async delete(config: DeleteConfig, basePath: string): Promise<void> {
    await deleteElement(config, basePath)
  }

  async createProject(project: ProjectData, basePath: string): Promise<void> {

    const appConfig: BaseApiConfig = {
      ...project.config as SpringConfigData,
      workspaceId: project.workspaceId,
      id: project.id,
      type: 'springboot',
    }

    // Ensure the basePath exists
    await ensureDirectoryExists(basePath);

    await newApi(appConfig, basePath);

  }

  async createResponse(config: ResponseConfig, basePath: string): Promise<void> {
    await addResponse(config, basePath);
  }

  async createEnum(data: EnumConfig, basePath: string): Promise<void> {
    await addEnum(data, basePath);
  }

  async serializeElement(data: any, basePath: string): Promise<void> {
    await createElement(data, basePath);
  }

}