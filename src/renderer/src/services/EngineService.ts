import type { AppComponentEntry } from '@igrp/igrp-studio-nextjs-engine'
import type { ComponentDef } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import RENDERER_CONFIG from '@renderer/renderer.config'
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
        // The ComponentRegisterConfig[] composition lives in the engine since
        // 0.2.0-beta.22 (`buildComponentRegistry`) so headless consumers (CLI)
        // share the exact pipeline. The engine bundle is Node-only, so the
        // renderer reaches it through IPC (main process) rather than importing
        // it directly. `FileTree` is Electron-world — narrow it to the engine's
        // `AppComponentEntry` shape before crossing the bridge.
        const appEntries: AppComponentEntry[] = appComponents.map((entry) => ({
            content: entry.content,
            customClassName: (entry as { customClassName?: string }).customClassName,
            data: (entry as { data?: Record<string, unknown> }).data,
            style: (entry as { style?: Record<string, unknown> }).style
        }))

        const { result: componentsToRegister, error: buildError } =
            await window.engine.buildComponentRegistry(ENV_TYPES.NEXTJS, {
                customComponents,
                appComponents: appEntries,
                currentPage,
                generatedPath: RENDERER_CONFIG.generatedPath,
                customComponentsPath: RENDERER_CONFIG.customComponentsPath
            })

        if (buildError) {
            console.error('buildComponentRegistry failed:', buildError)
            return
        }

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
