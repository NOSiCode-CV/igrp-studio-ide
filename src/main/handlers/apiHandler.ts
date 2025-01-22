// handlers/apiHandler.ts
import { EngineFactory } from '../engines/EngineFactory';
import { handleWithCustomErrors } from '../helpers';
import {
    ControllerConfig,
    DTOConfig
} from '@igrp/spring-engine/dist/interfaces/types'

import { addController, addDTO, addModel, addModule, engineTypes } from '@igrp/spring-engine'
import { addComponentToPage, deletePage, newPage } from '@igrp/nextjs-engine';

import { Component, PageConfig } from '@igrp/nextjs-engine/dist/interfaces/types'
import { ipcMain } from 'electron';
import { ProjectData } from '../types';

handleWithCustomErrors(
    'engine:create-project',
    async (_event, project: ProjectData, basePath: string) => {
        const engine = EngineFactory.getEngine(project.framework);
        await engine.createProject(project, basePath);
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
    'engine:create-enum',
    async (_event, data: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.createEnum(data, basePath);
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
    'next-engine:delete-page',
    async (_event, pageConfig: PageConfig, basePath: string) => {
        await deletePage(pageConfig, basePath)
    }
)