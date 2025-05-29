import { ComponentRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { ENV_TYPES } from "@renderer/constants/appConstants";
import { convertComponentsToJSONSchema } from "@renderer/utils/convertComponentsToJSONSchema";
import { HandlerResponse } from "src/main/types";

export const EngineService = {
    async getAppMetadata(basePath: string): Promise<HandlerResponse> {
        return await window.engine.getAppMetadata(ENV_TYPES.NEXTJS, basePath);
    },

    async startWatching(folderPath: string): Promise<void> {
        await window.electron.watchFolder(`${folderPath}/src/app/(myapp)`);
    }
    ,
    async getCodeSnippets(): Promise<HandlerResponse> {
        return await window.engine.getCodeSnippets(ENV_TYPES.NEXTJS);
    },
    async registerComponent(config: any): Promise<void> {
        console.log(config)
        const components: ComponentRegisterConfig[] = config.map((component: any) => ({
            name: component.name,
            label: component.name,
            properties: {
                customProperties: {
                    type: 'object',
                    properties: convertComponentsToJSONSchema(component.props),
                }
            },
            interactions: component.interactions,
            childrenTypes: [],
            imports: [`import {${component.name}} from '${component.path}'`],
            defaultValue: false,
            allowTypes: false,
            group: 'customComponents',
            customClassName: component.customClassName,
            customComponentTag: component.name,
            variants: {},
            propertiesMapping: {},
            interactionsMapping: {},
            data: component.data,
            dataMapping: {},
            style: component.style,
            styleMapping: {},
            rules: component.rules,
            rulesMapping: {},
            childProperties: {},
            childPropertiesMapping: {},
            states: [],
            acceptedChildren: [],
            renderer: 'custom',
            templatePath: ''
        }));

        const { result, error } = await window.engine.registerComponent(ENV_TYPES.NEXTJS, { components });

        console.log(result, error)
    }
};