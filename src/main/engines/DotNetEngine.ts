// engines/DotNetEngine.ts
import { newApi } from '@igrp/dotnet-engine';
import { BaseEngine } from '../interfaces';
import { BaseApiConfig, ResponseConfig } from  '@igrp/dotnet-engine/dist/interfaces/types';
import { ProjectData } from '../types';

export class DotNetEngine implements BaseEngine {
  createPermission (_data: any, _basePath: string) : Promise<void>{
    throw new Error('Method not implemented.');
  }
  serializeElement(_data: any, _basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  createEnum(_data: any, _basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  createResponse(_config: ResponseConfig, _basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async delete(_config: any, _basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async duplicate(_config: any, _basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createProject(project: ProjectData, basePath: string): Promise<void> {

    const { config } = project;

    const baseConfig: BaseApiConfig = {
      ...config,
      type: project.framework
    };

    await newApi(baseConfig, basePath);
  }


}