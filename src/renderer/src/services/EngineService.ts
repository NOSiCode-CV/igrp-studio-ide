import { ComponentRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";
import { ENV_TYPES } from "@renderer/constants/appConstants";
import { convertComponentsToJSONSchema } from "@renderer/utils/convertComponentsToJSONSchema";
import { getLabel } from "@renderer/utils";
import { FileTree, HandlerResponse } from "src/main/types";

export const EngineService = {
    async getAppMetadata(basePath: string): Promise<HandlerResponse> {
        return await window.engine.getAppMetadata(ENV_TYPES.NEXTJS, basePath);
    },

    async startWatching(folderPath: string): Promise<void> {
        await window.electron.watchFolder(`${folderPath}/src/app/(myapp)`);
    },

    async getCodeSnippets(): Promise<HandlerResponse> {
        return await window.engine.getCodeSnippets(ENV_TYPES.NEXTJS);
    },

    async registerComponent({ customComponents, appComponents, currentPage }: { customComponents: any, appComponents: FileTree[], currentPage: string }): Promise<void> {

        const components: ComponentRegisterConfig[] = customComponents.map((component: any) => ({
            name: component.name,
            label: getLabel(component.name),
            properties: {
                customProperties: {
                    type: 'object',
                    properties: convertComponentsToJSONSchema(component.props),
                }
            },
            interactions: component.interactions,
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
            templatePath: ''
        }));

        const _components: ComponentRegisterConfig[] = appComponents.filter((component) => component.content.scope === 'app' || ((component.content.type === 'page' && component.content.pageName === currentPage) || component.content.name !== currentPage))
            .map((component: any) => ({
                name: component.content.name,
                label: component.content.description || getLabel(component.content.name),
                properties: {
                    customProperties: {
                        type: 'object',
                        properties: component.props ? convertComponentsToJSONSchema(component.props) : undefined,
                    }
                },
                interactions: component.interactions,
                childrenTypes: [],
                imports: component.content.path ? [`import {${component.content.name}} from '${component.path}'`] : [],
                defaultValue: false,
                allowTypes: false,
                group: 'appComponents',
                customClassName: component.customClassName,
                customComponentTag: component.content.name,
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
                metadata: component.content

            }));

        const componentsToRegister = [...components, ..._components]

        const { result, error } = await window.engine.registerComponent(ENV_TYPES.NEXTJS, { components: componentsToRegister });
        if (error)
            console.log(result, error)
    }
};