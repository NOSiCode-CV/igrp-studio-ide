// engines/NextjsEngine.ts
import { deleteElement, initComponents, initServices, loadRegistry, loadServiceRegistry, newApp, newComponent, newPage } from '@igrp/igrp-studio-nextjs-engine';
import { BaseEngine } from '../interfaces';
import { AppConfig, ComponentConfig, ComponentRegistrationConfig, DeleteConfig, DockerServiceRegistrationConfig, PageConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { NextConfigData, ProjectData } from '../types';
import { ensureDirectoryExists } from '../helpers';


export class NextjsEngine implements BaseEngine {

  async registry(_basePath: string): Promise<void> {
    await initComponents()
  }

  async getServices(): Promise<DockerServiceRegistrationConfig> {
    await initServices()

    const result = loadServiceRegistry()
    console.log(result)
    return result;
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

    const { id, config, workspaceId } = project

    const appConfig: AppConfig = {
      ...config as NextConfigData,
      type: 'nextjs',
      workspaceId,
      id
    }

    // Ensure the basePath exists
    await ensureDirectoryExists(basePath);

    await newApp(appConfig, basePath);

  }
}