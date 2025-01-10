// handlers/apiHandler.ts

import { EngineFactory } from '../engines/EngineFactory';
import { handleWithCustomErrors } from '../helpers';
import {
    ControllerConfig,
    DTOBaseConfig,
    DTOConfig,
    ModelConfig
} from '@igrp/spring-engine/dist/interfaces/types'

import { addController, addDTO, addModel, addModule, deleteController, deleteDTO, deleteModel, engineTypes } from '@igrp/spring-engine'
import { addComponentToPage, deletePage, newApp, newPage } from '@igrp/nextjs-engine';

import { AppConfig, Component, PageConfig } from '@igrp/nextjs-engine/dist/interfaces/types'
import { ProjectRepository } from '../repo/projects';
import { ipcMain } from 'electron';

handleWithCustomErrors(
    'engine:create-api',
    async (_event, apiConfig: any, basePath: string) => {
        const engine = EngineFactory.getEngine(apiConfig.type);
        await engine.createApi(apiConfig, basePath);
    }
);

handleWithCustomErrors(
    'engine:create-response',
    async (_event, response: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.createResponse(response, basePath);
    }
);

handleWithCustomErrors(
    'engine:delete-element',
    async (_event, config: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.delete(config, basePath);
    }
);

handleWithCustomErrors('spring-engine:create-module', async (_event, moduleConfig, basePath) => {
    await addModule(moduleConfig, basePath)
})

handleWithCustomErrors('spring-engine:create-model', async (_event, modelConfig, basePath) => {
    await addModel(modelConfig, basePath)
})

handleWithCustomErrors(
    'spring-engine:delete-model',
    async (_event, modelConfig: ModelConfig, basePath: string) => {
        await deleteModel(modelConfig, basePath)
    }
)

handleWithCustomErrors(
    'spring-engine:delete-dto',
    async (_event, config: DTOBaseConfig, basePath: string) => {
        await deleteDTO(config, basePath)
    }
)

handleWithCustomErrors(
    'spring-engine:delete-controller',
    async (_event, config: ControllerConfig, basePath: string) => {
        await deleteController(config, basePath)
    }
)

handleWithCustomErrors(
    'spring-engine:create-dto',
    async (_event, dtoConfig: DTOConfig, basePath: string) => {
        await addDTO(dtoConfig, basePath)
    }
)

handleWithCustomErrors(
    'spring-engine:create-controller',
    async (_event, controllerConfig: ControllerConfig, basePath: string) => {
        await addController(controllerConfig, basePath)
    }
)

ipcMain.handle('spring-engine:fetch-selectors', async (_event, module: string, basePath: string) => {
    return await engineTypes(module, basePath)
})

handleWithCustomErrors(
    'next-engine:create-page',
    async (_event, pageConfig: PageConfig, basePath: string) => {
        await newPage(pageConfig, basePath)
    }
)

handleWithCustomErrors(
    'next-engine:add-component-page',
    async (_event, pageConfig: PageConfig, components: Component[], basePath: string) => {
        await addComponentToPage(pageConfig, components, basePath)
    }
)

handleWithCustomErrors(
    'next-engine:create-app',
    async (_event, appConfig: AppConfig, basePath: string) => {
        const repo = new ProjectRepository()
        await newApp(appConfig, basePath)
        await repo.save({
            path: basePath,
            dt_created: new Date(),
            location: 'local',
            config: {
                type: appConfig.type,
                name: appConfig.appName
            }
        })
    }
)

handleWithCustomErrors(
    'next-engine:delete-page',
    async (_event, pageConfig: PageConfig, basePath: string) => {
        await deletePage(pageConfig, basePath)
    }
)