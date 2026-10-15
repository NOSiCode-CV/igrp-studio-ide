// engines/SpringEngine.ts
import {
    addController,
    addDTO,
    addEnum,
    addGraphQLSchema,
    addModel,
    addModule,
    addResponse,
    serializeElement as createElement,
    deleteElement,
    getSpringDependencies,
    loadEngineConfiguration,
    newApi,
    setEngineConfiguration
} from '@igrp/igrp-studio-springboot-engine'
import type {
    BaseApiConfig,
    ControllerConfig,
    DeleteConfig,
    Dependency,
    DTOConfig,
    EnumConfig,
    GraphQLSchemaConfig,
    ModelConfig,
    ModuleConfig,
    ResponseConfig
} from '@igrp/igrp-studio-springboot-engine/types'
import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { ensureDirectoryExists } from '../helpers'
import type { BaseEngine } from '../interfaces'
import type { ProjectData } from '../types'

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
        throw new Error('Method not implemented.')
    }
    async delete(config: DeleteConfig, basePath: string): Promise<void> {
        await deleteElement(config, basePath)
    }

    async duplicate(config: any, basePath: string): Promise<void> {
        // Each duplicate needs a unique name AND a unique id — a fixed
        // `${name}Copy` / `${id}_copy` suffix meant every subsequent
        // duplication of the same artifact resolved to the same filename
        // and id, so the engine kept overwriting the previous copy instead
        // of adding a new one. Mint a fresh UUID for the id and append a
        // short random suffix to the display name so the created artifact
        // never collides with earlier copies.
        const { name, type, module, content } = config
        const uniqueSuffix = randomUUID().slice(0, 6)
        const duplicateName = `${name}Copy${uniqueSuffix}`

        const duplicateContent = JSON.parse(JSON.stringify(content))
        duplicateContent.name = duplicateName
        duplicateContent.id = randomUUID()

        // Create the duplicate based on type
        switch (type) {
            case 'model':
                await addModel({ ...duplicateContent, module }, basePath)
                break
            case 'dto':
                await addDTO({ ...duplicateContent, module }, basePath)
                break
            case 'controller':
                await addController({ ...duplicateContent, module }, basePath)
                break
            case 'enum':
                await addEnum({ ...duplicateContent, module }, basePath)
                break
            case 'response':
                await addResponse({ ...duplicateContent, module }, basePath)
                break
            default:
                throw new Error(`Unsupported type for duplication: ${type}`)
        }
    }

    async createProject(project: ProjectData, basePath: string): Promise<void> {
        const appConfig: BaseApiConfig = {
            ...project.config,
            version: app.getVersion(),
            workspaceId: project.workspaceId,
            id: project.id,
            type: 'springboot'
        }

        // Ensure the basePath exists
        await ensureDirectoryExists(basePath)

        await newApi(appConfig, basePath)
    }

    async createResponse(config: ResponseConfig, basePath: string): Promise<void> {
        await addResponse(config, basePath)
    }

    async createEnum(data: EnumConfig, basePath: string): Promise<void> {
        await addEnum(data, basePath)
    }

    async createGraphqlSchema(config: GraphQLSchemaConfig, basePath: string): Promise<void> {
        await addGraphQLSchema(config, basePath)
    }

    async serializeElement(data: any, basePath: string): Promise<void> {
        await createElement(data, basePath)
    }

    async registry(): Promise<void> {
        setEngineConfiguration({
            environment: 'production'
        })

        loadEngineConfiguration()
    }
}
