import { AppExportsConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { ENV_TYPES } from "@renderer/constants/appConstants";

export const EngineService = {
    async getAppMetadata(basePath: string): Promise<AppExportsConfig> {
        return await window.engine.getAppMetadata(ENV_TYPES.NEXTJS, basePath);
    },

    async startWatching(folderPath: string): Promise<void> {
        await window.electron.watchFolder(folderPath);
    }
};