import React, { useEffect } from 'react'
import { useComponentsContext } from '../contexts/ComponentsContext'

export const ComponentsLoader: React.FC = () => {
  const { loadRegistryComponent, componentsRegistered } = useComponentsContext()

  useEffect(() => {
    // Only load if we don't have components yet
    if (componentsRegistered.length === 0) {
      loadRegistryComponent()
    }
  }, [loadRegistryComponent, componentsRegistered.length])

  return null // This component doesn't render anything
}
