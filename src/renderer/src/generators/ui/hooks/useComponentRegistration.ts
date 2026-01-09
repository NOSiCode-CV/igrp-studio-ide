import { useEffect } from 'react'
import { EngineService } from '@renderer/services/EngineService'
import { PageDefinition } from '../page/page-manager'
import { useComponentsContext } from '../contexts/ComponentsContext'

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
    registerComponents();
  }, [customComponents])

  return {
    registerComponents
  }
}
