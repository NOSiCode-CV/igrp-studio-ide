import type { ComponentDef } from '@igrp/igrp-studio-nextjs-engine/types'
import { useComponentsContext } from '@renderer/features/engine-catalog'
import useStudio from '@renderer/hooks/use-studio'
import { EngineService } from '@renderer/services/EngineService'
import { useEffect } from 'react'
import type { FileTree } from 'src/main/types'
import type { PageDefinition } from '../browser/page-manager'

interface ComponentRegistrationProps {
    customComponents: ComponentDef[]
    fetchComponents: () => FileTree[]
    page: PageDefinition
}

interface ComponentRegistrationPropsReturn {
    registerComponents: () => void
}

/**
 * Module-level cache of registrations already performed during the session.
 * Keyed by `${basePath}::${pageName}::${customComponentsSignature}` — the
 * project path is part of the key so a page with the same name in a different
 * project still registers (and doesn't collide with another project's page).
 * Prevents redundant IPC calls when several PageBuilder tabs mount the same
 * (project, page, customComponents) combination.
 */
const registeredKeys = new Set<string>()

const buildKey = (basePath: string, pageName: string, customComponents: ComponentDef[]): string => {
    const sig = customComponents
        .map((c) => c.name)
        .sort()
        .join(',')
    return `${basePath}::${pageName}::${sig}`
}

export const useComponentRegistration = ({
    customComponents,
    fetchComponents,
    page
}: ComponentRegistrationProps): ComponentRegistrationPropsReturn => {
    const { loadRegistryComponent } = useComponentsContext()
    const { basePath } = useStudio()

    const registerComponents = (): void => {
        const appComponents: FileTree[] = fetchComponents()

        EngineService.registerComponent({
            customComponents,
            appComponents,
            currentPage: page.pageName,
            loadRegistryComponent,
            // Lets EngineService reset the engine registry when the active
            // project changes, so custom components don't leak across projects.
            basePath
        })
    }

    useEffect(() => {
        const key = buildKey(basePath, page.pageName, customComponents)
        if (registeredKeys.has(key)) return
        registeredKeys.add(key)
        registerComponents()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customComponents, page.pageName, basePath])

    return {
        registerComponents
    }
}
