import type { ComponentDef, ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import RENDERER_CONFIG from '@renderer/renderer.config'
import { capitalize, getLabel } from '@renderer/utils'
import {
    convertComponentsToJSONSchema,
    convertCompToInteractinsJSONSchema,
    convertCompToRulesJSONSchema
} from '@renderer/utils/register-schema'
import type { FileTree, HandlerResponse } from 'src/main/types'

// Tracks the project whose custom/app components are currently registered in
// the (global) engine registry. When it changes we reset the registry so
// components from the previous project don't leak into the new one.
let lastRegisteredProjectPath: string | null = null

export const EngineService = {
    async getAppMetadata(basePath: string): Promise<HandlerResponse> {
        return await window.engine.getAppMetadata(ENV_TYPES.NEXTJS, basePath)
    },

    async startWatching(folderPath: string): Promise<void> {
        await window.electron.watchFolder(`${folderPath}/src/app/(igrp)`)
    },

    async getCodeSnippets(): Promise<HandlerResponse> {
        return await window.engine.getCodeSnippets(ENV_TYPES.NEXTJS)
    },

    async resetComponents(): Promise<void> {
        await window.engine.resetComponents(ENV_TYPES.NEXTJS)
        lastRegisteredProjectPath = null
    },

    async registerComponent({
        customComponents,
        appComponents,
        currentPage,
        loadRegistryComponent,
        basePath
    }: {
        customComponents: ComponentDef[]
        appComponents: FileTree[]
        currentPage: string
        loadRegistryComponent: () => void
        basePath?: string
    }): Promise<void> {
        const components: ComponentRegisterConfig[] = customComponents.map(
            (component: ComponentDef) => ({
                name: component.name,
                label: getLabel(component.name),
                properties: {
                    customProperties: {
                        type: 'object',
                        properties: convertComponentsToJSONSchema(component.props)
                    }
                },
                interactions: convertCompToInteractinsJSONSchema(component.props),
                childrenTypes: [],
                imports: component.path
                    ? [`import {${component.name}} from '${component.path}'`]
                    : [],
                defaultValue: false,
                allowTypes: false,
                group: 'customComponents',
                customClassName: '',
                customComponentTag: component.name,
                variants: {},
                propertiesMapping: {},
                interactionsMapping: {},
                data: {},
                dataMapping: {},
                style: {},
                styleMapping: {},
                rules: convertCompToRulesJSONSchema(),
                rulesMapping: {},
                childProperties: {},
                childPropertiesMapping: {},
                states: [],
                acceptedChildren: [],
                renderer: 'custom',
                templatePath: '',
                defaultChildren: [],
                allowChildren: component.allowChildren ?? false,
                metadata: {}
            })
        )

        const _components: ComponentRegisterConfig[] = appComponents
            .filter(
                (component) =>
                    component.content.scope === 'app' ||
                    (component.content.scope === 'page' &&
                        component.content.pageName === currentPage) ||
                    component.content.name !== currentPage
            )
            .map((component: any) => ({
                name: capitalize(component.content.name),
                label: component.content.description || getLabel(component.content.name),
                properties: {
                    customProperties: {
                        type: 'object',
                        properties: convertComponentsToJSONSchema(component.content.args)
                    }
                },
                interactions: convertCompToInteractinsJSONSchema(component.content.args),
                childrenTypes: [],
                imports: [
                    `import ${capitalize(component.content.name)} from '${component.content.pageName ? RENDERER_CONFIG.generatedPath + component.content.pagePath + '/components/' + component.content.name.toLowerCase() : RENDERER_CONFIG.customComponentsPath + component.content.name.toLowerCase()}'`
                ],
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
                rules: convertCompToRulesJSONSchema(),
                rulesMapping: {},
                childProperties: {},
                childPropertiesMapping: {},
                states: [],
                acceptedChildren: [],
                renderer: 'custom',
                templatePath: '',
                metadata: component.content,
                defaultChildren: []
            }))

        const componentsToRegister = [...components, ..._components]

        // Switching project: drop the previous project's custom/app components
        // from the (global) engine registry before registering this project's,
        // so they don't leak across projects. Built-ins are preserved.
        if (basePath && basePath !== lastRegisteredProjectPath) {
            await window.engine.resetComponents(ENV_TYPES.NEXTJS)
            lastRegisteredProjectPath = basePath
        }

        const { result, error } = await window.engine.registerComponent(ENV_TYPES.NEXTJS, {
            components: componentsToRegister
        })
        if (error) console.log(result, error)
        else loadRegistryComponent()
    }
}
