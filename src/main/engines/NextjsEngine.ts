// engines/NextjsEngine.ts
import { deleteElement, initComponents, loadRegistry, newApp, newComponent, newPage } from '@igrp/igrp-studio-nextjs-engine';
import { BaseEngine } from '../interfaces';
import { ProjectRepository } from '../repo/projects';
import { AppConfig, ComponentConfig, ComponentRegistrationConfig, DeleteConfig, PageConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { ProjectData } from '../types';


export class NextjsEngine implements BaseEngine {

  async registryComponent(_basePath: string): Promise<void> {
    await initComponents()
  }

  getComponents(): ComponentRegistrationConfig {
    const result = loadRegistry()
    return result;
  }

  async delete(config: DeleteConfig, basePath: string): Promise<void> {
    await deleteElement(config, basePath)
  }

  async createPage(pageConfig: any, basePath: string): Promise<void> {

    if (pageConfig.type === 'component') {
      await newComponent(pageConfig as ComponentConfig, basePath);
    } else
      await newPage(pageConfig as PageConfig, basePath);
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