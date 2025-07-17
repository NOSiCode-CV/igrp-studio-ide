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
    console.log(config)
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
    await deleteElement(config, basePath);
  }

  async duplicate(config: any, basePath: string): Promise<void> {
    // For Spring engine, we'll create a copy with a modified name
    const { name, type, module, content } = config;
    const duplicateName = `${name}Copy`;
    
    // Create a deep copy of the content and update the name
    const duplicateContent = JSON.parse(JSON.stringify(content));
    duplicateContent.name = duplicateName;
    duplicateContent.id = `${duplicateContent.id}_copy`;
    
    // Create the duplicate based on type
    switch (type) {
      case 'model':
        await addModel({ ...duplicateContent, module }, basePath);
        break;
      case 'dto':
        await addDTO({ ...duplicateContent, module }, basePath);
        break;
      case 'controller':
        await addController({ ...duplicateContent, module }, basePath);
        break;
      case 'enum':
        await addEnum({ ...duplicateContent, module }, basePath);
        break;
      case 'response':
        await addResponse({ ...duplicateContent, module }, basePath);
        break;
      default:
        throw new Error(`Unsupported type for duplication: ${type}`);
    }
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