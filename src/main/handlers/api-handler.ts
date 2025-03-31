// handlers/apiHandler.ts
import { EngineFactory } from '../engines/EngineFactory';
import { handleWithCustomErrors } from '../helpers';

import { engineTypes } from '@igrp/igrp-studio-springboot-engine'

import { ipcMain } from 'electron';
import { ProjectData } from '../types';
import { PageConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { EVENTS } from '../constants/events';

handleWithCustomErrors(
    EVENTS.ENGINE.CREATE_PROJECT,
    async (_event, project: ProjectData, basePath: string) => {
        const engine = EngineFactory.getEngine(project.framework);
        await engine.createProject(project, basePath);
    }
);

handleWithCustomErrors(
    EVENTS.SPRING.CREATE_ENUM,
    async (_event, config: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.createEnum?.(config, basePath);
    }
);

handleWithCustomErrors(
    EVENTS.SPRING.CREATE_RESPONSE,
    async (_event, response: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.createResponse?.(response, basePath);
    }
);

handleWithCustomErrors(
    EVENTS.SPRING.CREATE_MODULE,
    async (_event, moduleConfig: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.createModule?.(moduleConfig, basePath);
    }
);


handleWithCustomErrors(
    EVENTS.SPRING.CREATE_MODEL,
    async (_event, modelConfig: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.createModel?.(modelConfig, basePath);
    }
);

handleWithCustomErrors(
    EVENTS.SPRING.CREATE_DTO,
    async (_event, dtoConfig: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.createDto?.(dtoConfig, basePath);
    }
);


handleWithCustomErrors(
    EVENTS.SPRING.CREATE_CONTROLLER,
    async (_event, controllerConfig: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.createController?.(controllerConfig, basePath);
    }
);


handleWithCustomErrors(
    EVENTS.ENGINE.DELETE_ELEMENT,
    async (_event, config: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.delete(config, basePath);
    }
);

handleWithCustomErrors(
    EVENTS.ENGINE.SERIALIZE_ELEMENT,
    async (_event, config: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.serializeElement?.(config, basePath);
    }
);


handleWithCustomErrors(
    EVENTS.NEXT.CREATE_PAGE,
    async (_event, pageConfig: PageConfig, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.createPage?.(pageConfig, basePath);
    }
);

handleWithCustomErrors(
    EVENTS.NEXT.DELETE_PAGE,
    async (_event, pageConfig: PageConfig, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.delete?.(pageConfig, basePath);
    }
);

handleWithCustomErrors(
    EVENTS.NEXT.REGISTRY_COMPONENT,
    async (_event, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType);
        await engine.registryComponent?.(basePath);
    }
);

handleWithCustomErrors(
    EVENTS.NEXT.GET_COMPONENT,
    async (_event, engineType: string) => {
        const engine = EngineFactory.getEngine(engineType);
        const data = engine.getComponents?.();
        return data;
    }
);

handleWithCustomErrors(
    EVENTS.ENGINE.GET_DEPENDENCIES,
    async (_event, engineType: string) => {
        const engine = EngineFactory.getEngine(engineType);
        const data = engine.getDependencies?.();
        return data;
    }
);

ipcMain.handle(EVENTS.SPRING.FETCH_SELECTORS, async (_event, module: string, basePath: string) => {
    return await engineTypes(module, basePath);
});