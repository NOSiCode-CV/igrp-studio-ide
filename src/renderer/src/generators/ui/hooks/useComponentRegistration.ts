import { EngineService } from '@renderer/services/EngineService'
import { useEffect } from 'react'
import { useComponentsContext } from '../contexts/ComponentsContext'
import type { PageDefinition } from '../page/page-manager'

interface ComponentRegistrationProps {
    customComponents: any[]
    fetchComponents: () => any[]
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
        const appComponents = fetchComponents()

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
