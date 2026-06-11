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

    async registerComponent({
        customComponents,
        appComponents,
        currentPage,
        loadRegistryComponent
    }: {
        customComponents: ComponentDef[]
        appComponents: FileTree[]
        currentPage: string
        loadRegistryComponent: () => void
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
            // Resilient: skip components whose metadata has no resolvable name
            // (e.g. a malformed / foreign-schema `.igrpstudio` JSON) so a single
            // bad file can't crash registration and hide ALL components. Accept
            // the legacy `componentName` field as a fallback for `name`.
            .filter((component: any) => {
                const name = component?.content?.name ?? component?.content?.componentName
                if (!name) {
                    console.warn('Skipping component with no name in metadata:', component?.content)
                    return false
                }
                const c = component.content
                return (
                    c.scope === 'app' ||
                    (c.scope === 'page' && c.pageName === currentPage) ||
                    name !== currentPage
                )
            })
            .map((component: any) => {
                const name: string = component.content.name ?? component.content.componentName
                return {
                    name: capitalize(name),
                    label: component.content.description || getLabel(name),
                    properties: {
                        customProperties: {
                            type: 'object',
                            properties: convertComponentsToJSONSchema(component.content.args)
                        }
                    },
                    interactions: convertCompToInteractinsJSONSchema(component.content.args),
                    childrenTypes: [],
                    imports: [
                        `import ${capitalize(name)} from '${component.content.pageName ? RENDERER_CONFIG.generatedPath + component.content.pagePath + '/components/' + name.toLowerCase() : RENDERER_CONFIG.customComponentsPath + name.toLowerCase()}'`
                    ],
                    defaultValue: false,
                    allowTypes: false,
                    group: 'appComponents',
                    customClassName: component.customClassName,
                    customComponentTag: capitalize(name),
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
                }
            })

        const componentsToRegister = [...components, ..._components]

        const { result, error } = await window.engine.registerComponent(ENV_TYPES.NEXTJS, {
            components: componentsToRegister
        })
        if (error) console.log(result, error)
        else loadRegistryComponent()
    }
}
