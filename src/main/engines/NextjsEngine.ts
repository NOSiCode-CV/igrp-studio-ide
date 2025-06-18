// engines/NextjsEngine.ts
import { deleteElement, initCodeSnippets, initComponents, initServices, loadAppExports, loadCodeSnippetsRegistry, loadRegistry, loadServiceRegistry, newApp, newComponent, newPage, registerComponents } from '@igrp/igrp-studio-nextjs-engine';
import { BaseEngine } from '../interfaces';
import { AppConfig, AppExportsConfig, CodeSnippetsRegistrationConfig, ComponentConfig, ComponentRegistrationConfig, DeleteConfig, DockerServiceRegistrationConfig, PageConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { NextConfigData, ProjectData } from '../types';
import { ensureDirectoryExists } from '../helpers';
import path from 'path';


export class NextjsEngine implements BaseEngine {

  async registry(): Promise<void> {
    await initComponents()
    await initServices()
    await initCodeSnippets();
  }

  async getServices(): Promise<DockerServiceRegistrationConfig> {
    const result = loadServiceRegistry()
    return result;
  }

  async getAppMetadata(basePath: string): Promise<AppExportsConfig> {
    return await loadAppExports(basePath)
  }

  getComponents(): ComponentRegistrationConfig {
    const result = loadRegistry()
    return result;
  }

  registerComponent(config: ComponentRegistrationConfig): void {
    registerComponents(config)
  }

  getCodeSnippets(): CodeSnippetsRegistrationConfig {
    const result = loadCodeSnippetsRegistry()
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

    //const appVersion = app.getVersion()

    const { id, config, workspaceId,/*  engineVersion: appVersion */ } = project

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