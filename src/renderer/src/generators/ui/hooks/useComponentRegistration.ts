import type { ComponentDef } from '@igrp/igrp-studio-nextjs-engine/types'
import { EngineService } from '@renderer/services/EngineService'
import { useEffect } from 'react'
import type { FileTree } from 'src/main/types'
import { useComponentsContext } from '../contexts/ComponentsContext'
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
 * Keyed by `${pageName}:${customComponentsSignature}`. Prevents redundant IPC
 * calls when several PageBuilder tabs mount the same (page, customComponents)
 * combination.
 */
const registeredKeys = new Set<string>()

const buildKey = (pageName: string, customComponents: ComponentDef[]): string => {
    const sig = customComponents
        .map((c) => c.name)
        .sort()
        .join(',')
    return `${pageName}::${sig}`
}

export const useComponentRegistration = ({
    customComponents,
    fetchComponents,
    page
}: ComponentRegistrationProps): ComponentRegistrationPropsReturn => {
    const { loadRegistryComponent } = useComponentsContext()

    const registerComponents = (): void => {
        const appComponents: FileTree[] = fetchComponents()

        EngineService.registerComponent({
            customComponents,
            appComponents,
            currentPage: page.pageName,
            loadRegistryComponent
        })
    }

    useEffect(() => {
        const key = buildKey(page.pageName, customComponents)
        if (registeredKeys.has(key)) return
        registeredKeys.add(key)
        registerComponents()
    }, [customComponents, page.pageName])

    return {
        registerComponents
    }
}
