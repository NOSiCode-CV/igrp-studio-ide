// handlers/apiHandler.ts

import { BaseApiConfig } from '../engine';
import { EngineFactory } from '../engines/EngineFactory';
import { handleWithCustomErrors } from '../helpers';

handleWithCustomErrors(
    'engine:create-api',
    async (_event, apiConfig: BaseApiConfig, basePath: string) => {
        const engine = EngineFactory.getEngine(apiConfig.type);
        await engine.createApi(apiConfig, basePath);
    });