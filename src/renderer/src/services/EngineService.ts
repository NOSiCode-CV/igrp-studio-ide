import { ComponentRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { ENV_TYPES } from "@renderer/constants/appConstants";
import { convertComponentsToJSONSchema, convertCompToInteractinsJSONSchema } from "@renderer/utils/convertComponentsToJSONSchema";
import { capitalize, getLabel } from "@renderer/utils";
import { FileTree, HandlerResponse } from "src/main/types";
import RENDERER_CONFIG from "@renderer/renderer.config";

export const EngineService = {
    async getAppMetadata(basePath: string): Promise<HandlerResponse> {
        return await window.engine.getAppMetadata(ENV_TYPES.NEXTJS, basePath);
    },

    async startWatching(folderPath: string): Promise<void> {
        await window.electron.watchFolder(`${folderPath}/src/app/(igrp)`);
    },

    async getCodeSnippets(): Promise<HandlerResponse> {
        return await window.engine.getCodeSnippets(ENV_TYPES.NEXTJS);
    },

    async registerComponent({ customComponents, appComponents, currentPage, loadRegistryComponent }: { customComponents: any, appComponents: FileTree[], currentPage: string, loadRegistryComponent: () => void }): Promise<void> {
        const components: ComponentRegisterConfig[] = customComponents.map((component: any) => ({
            name: component.name,
            label: getLabel(component.name),
            properties: {
                customProperties: {
                    type: 'object',
                    properties: convertComponentsToJSONSchema(component.props),
                }
            },
            interactions: convertCompToInteractinsJSONSchema(component.props),
            childrenTypes: [],
            imports: component.path ? [`import {${component.name}} from '${component.path}'`] : [],
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
            templatePath: '',
            defaultChildren: []
        }));

        const _components: ComponentRegisterConfig[] = appComponents.filter((component) => component.content.scope === 'app' || ((component.content.scope === 'page' && component.content.pageName === currentPage) || component.content.name !== currentPage))
            .map((component: any) => ({
                name: capitalize(component.content.name),
                label: component.content.description || getLabel(component.content.name),
                properties: {
                    customProperties: {
                        type: 'object',
                        properties: convertComponentsToJSONSchema(component.content.args),
                    }
                },
                interactions: convertCompToInteractinsJSONSchema(component.content.args),
                childrenTypes: [],
                imports: [`import ${capitalize(component.content.name)} from '${component.content.pageName ? RENDERER_CONFIG.generatedPath + component.content.pagePath + '/components/' + component.content.name.toLowerCase() : RENDERER_CONFIG.customComponentsPath + component.content.name.toLowerCase()}'`],
                defaultValue: false,
                allowTypes: false,
                group: 'appComponents',
                customClassName: component.customClassName,
                customComponentTag: capitalize(component.content.name),
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
                templatePath: '',
                metadata: component.content,
                defaultChildren: []
            }));

        const componentsToRegister = [...components, ..._components]

        const { result, error } = await window.engine.registerComponent(ENV_TYPES.NEXTJS, { components: componentsToRegister });
        if (error)
            console.log(result, error)
        else
            loadRegistryComponent();
    }
};