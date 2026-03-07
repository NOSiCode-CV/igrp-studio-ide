import { EngineService } from '@renderer/services/EngineService'
import { useEffect } from 'react'
import { useComponentsContext } from '../contexts/ComponentsContext'
import type { PageDefinition } from '../page/page-manager'
import { ComponentDef } from '@igrp/igrp-studio-nextjs-engine/types'
import { FileTree } from 'src/main/types'

interface ComponentRegistrationProps {
    customComponents: ComponentDef[]
    fetchComponents: () => FileTree[]
    page: PageDefinition
}

interface ComponentRegistrationPropsReturn {
    registerComponents: () => void
}

export const useComponentRegistration = ({
    customComponents,
    fetchComponents,
    page
}: ComponentRegistrationProps): ComponentRegistrationPropsReturn => {
    // Use shared context for components
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
        registerComponents()
    }, [customComponents])

    return {
        registerComponents
    }
}
