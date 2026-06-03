// engines/NextjsEngine.ts
import {
    deleteElement,
    initCodeSnippets,
    initComponents,
    loadAppExports,
    loadCodeSnippetsRegistry,
    loadEngineConfiguration,
    loadRegistry,
    newApp,
    newComponent,
    newPage,
    newProcess,
    newProcessStep,
    registerComponents,
    setEngineConfiguration
} from '@igrp/igrp-studio-nextjs-engine'
import type {
    AppConfig,
    AppExportsConfig,
    CodeSnippetsRegistrationConfig,
    ComponentConfig,
    ComponentRegistrationConfig,
    DeleteConfig,
    PageConfig,
    ProcessConfig,
    ProcessStepConfig
} from '@igrp/igrp-studio-nextjs-engine/types'
import { initServices, loadServiceRegistry } from '@igrp/igrp-studio-workspace-engine'
import type { DockerServiceRegistrationConfig } from '@igrp/igrp-studio-workspace-engine/dist/interfaces/types'
import { app } from 'electron'
import { ensureDirectoryExists } from '../helpers'
import type { BaseEngine } from '../interfaces'
import type { NextConfigData, ProjectData } from '../types'

export class NextjsEngine implements BaseEngine {
    async registry(): Promise<void> {
        await initComponents()
        await initServices()
        await initCodeSnippets()

        setEngineConfiguration({
            environment: 'production'
        })

        loadEngineConfiguration()
    }

    async getServices(): Promise<DockerServiceRegistrationConfig> {
        const result = loadServiceRegistry()
        return result
    }

    async getAppMetadata(basePath: string): Promise<AppExportsConfig> {
        return await loadAppExports(basePath)
    }

    getComponents(): ComponentRegistrationConfig {
        const result = loadRegistry()
        return result
    }

    registerComponent(config: ComponentRegistrationConfig): void {
        registerComponents(config)
    }

    getCodeSnippets(): CodeSnippetsRegistrationConfig {
        const result = loadCodeSnippetsRegistry()
        return result
    }

    async delete(config: DeleteConfig, basePath: string): Promise<void> {
        await deleteElement(config, basePath)
    }

    async duplicate(config: any, basePath: string): Promise<void> {
        // For Next.js engine, we'll create a copy with a modified name
        const { name, type, module, content } = config
        const duplicateName = `${name}Copy`

        // Create a deep copy of the content and update the name
        const duplicateContent = JSON.parse(JSON.stringify(content))
        duplicateContent.name = duplicateName
        duplicateContent.id = `${duplicateContent.id}_copy`

        // Create the duplicate based on type
        switch (type) {
            case 'page':
                await newPage({ ...duplicateContent, module }, basePath)
                break
            case 'component':
                await newComponent({ ...duplicateContent, module }, basePath)
                break
            default:
                throw new Error(`Unsupported type for duplication: ${type}`)
        }
    }

    async createPage(pageConfig: any, basePath: string): Promise<void> {
        if (pageConfig.type === 'component') {
            await newComponent(pageConfig as ComponentConfig, basePath)
        } else await newPage(pageConfig as PageConfig, basePath)
    }

    async createProject(project: ProjectData, basePath: string): Promise<void> {
        const { id, config, workspaceId } = project

        const appConfig: AppConfig = {
            ...(config as NextConfigData),
            version: app.getVersion(),
            type: 'nextjs',
            workspaceId,
            id
        }

        // Ensure the basePath exists
        await ensureDirectoryExists(basePath)

        await newApp(appConfig, basePath)
    }

    async createProcess(process: ProcessConfig, basePath: string): Promise<void> {
        await newProcess(process, basePath)
    }

    async createProcessStep(step: ProcessStepConfig, basePath: string): Promise<void> {
        await newProcessStep(step, basePath)
    }
}
