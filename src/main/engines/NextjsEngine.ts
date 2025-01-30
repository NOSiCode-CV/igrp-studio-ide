// engines/DotNetEngine.ts
import { newApp } from '@igrp/nextjs-engine';
import { BaseEngine } from '../interfaces';
import { ProjectRepository } from '../repo/projects';
import { AppConfig } from '@igrp/nextjs-engine/dist/interfaces/types';
import { ProjectData } from '../types';
import { ResponseConfig } from '@igrp/dotnet-engine/dist/interfaces/types';

export class NextjsEngine implements BaseEngine {

  createEnum(_data: any, _basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }


  createResponse(_config: ResponseConfig, _basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async delete(_config: any, _basePath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createProject(project: ProjectData, basePath: string): Promise<void> {

    const repo = new ProjectRepository()

    const nextConfig: AppConfig = {
      ...project.config,
      type: 'baseApp'
    }

    await newApp(nextConfig, basePath);

    await repo.save({
      ...project,
      path: basePath,
      dt_created: new Date(),
      location: 'local'
    });
  }
}