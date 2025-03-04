// engines/DotNetEngine.ts
import { deletePage, getOneComponent, initComponents, newApp, newComponent, newPage } from '@igrp/igrp-studio-nextjs-engine';
import { BaseEngine } from '../interfaces';
import { ProjectRepository } from '../repo/projects';
import { AppConfig, ComponentConfig, PageConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { ProjectData } from '../types';

export class NextjsEngine implements BaseEngine {

  async delete(config: any, basePath: string): Promise<void> {
    await deletePage(config, basePath)
  }

  async createPage(pageConfig: any, basePath: string): Promise<void> {

    await initComponents();

     const result = await getOneComponent({
      'name': 'aspect'
    }) 

    console.log(result)

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