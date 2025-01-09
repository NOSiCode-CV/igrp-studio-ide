import { BaseApiConfig } from "../engine";

export interface BaseEngine {
    createApi(apiConfig: BaseApiConfig, basePath: string): Promise<void>;
}