import { ENV_TYPES } from "@renderer/constants/appConstants";
import { HandlerResponse } from "src/main/types";

export const EngineService = {
    async getAppMetadata(basePath: string): Promise<HandlerResponse> {
        return await window.engine.getAppMetadata(ENV_TYPES.NEXTJS, basePath);
    },

    async startWatching(folderPath: string): Promise<void> {
        await window.electron.watchFolder(folderPath);
    }
    ,
    async getCodeSnippets(): Promise<HandlerResponse> {
        return await window.engine.getCodeSnippets(ENV_TYPES.NEXTJS);
    },
};