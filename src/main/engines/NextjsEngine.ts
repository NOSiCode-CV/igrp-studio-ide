// engines/DotNetEngine.ts
import { deletePage, newApp, newPage } from '@igrp/igrp-studio-nextjs-engine';
import { BaseEngine } from '../interfaces';
import { ProjectRepository } from '../repo/projects';
import { AppConfig, PageConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { ProjectData } from '../types';

export class NextjsEngine implements BaseEngine {

  async delete(config: any, basePath: string): Promise<void> {
    await deletePage(config, basePath)
  }

  async createPage(pageConfig: PageConfig, basePath: string): Promise<void> {
    await newPage(pageConfig, basePath);
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