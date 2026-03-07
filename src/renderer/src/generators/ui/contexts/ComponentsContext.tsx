import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import type React from 'react'
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react'

interface ComponentsContextType {
    componentsRegistered: ComponentRegisterConfig[]
    setComponentsRegistered: (components: ComponentRegisterConfig[]) => void
    loadRegistryComponent: () => Promise<ComponentRegisterConfig[]>
    isLoading: boolean
}

const ComponentsContext = createContext<ComponentsContextType | undefined>(undefined)

export const ComponentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [componentsRegistered, setComponentsRegistered] = useState<ComponentRegisterConfig[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const loadRegistryComponent = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await window.engine?.getComponent(ENV_TYPES.NEXTJS)
            if (!result) {
                return []
            }
            const components = result.result?.components ?? []
            setComponentsRegistered(components)
            return components
        } catch (error) {
            console.error('[Debug] ComponentsContext: Failed to load components:', error)
            return []
        } finally {
            setIsLoading(false)
        }
    }, [])

    return (
        <ComponentsContext.Provider
            value={{
                componentsRegistered,
                setComponentsRegistered,
                loadRegistryComponent,
                isLoading
            }}
        >
            {children}
        </ComponentsContext.Provider>
    )
}

export const useComponentsContext = () => {
    const context = useContext(ComponentsContext)
    if (context === undefined) {
        throw new Error('useComponentsContext must be used within a ComponentsProvider')
    }
    return context
}
