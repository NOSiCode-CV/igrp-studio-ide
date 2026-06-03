/**
 * Loads the IGRP component catalog from the Next.js engine
 * (`window.engine.getComponent(ENV_TYPES.NEXTJS)`) once per session and
 * makes it available to any surface that needs it — UI generator palette,
 * Prototype palette, future generators.
 *
 * Lifted from `generators/ui/contexts/ComponentsContext.tsx` so the catalog
 * is no longer owned by a single generator; renamed for semantic clarity
 * (we load the *engine's* catalog of components, not arbitrary components).
 * Back-compat aliases live in `./index.ts`.
 */

import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import type React from 'react'
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react'

export interface EngineCatalogContextType {
    /**
     * Full catalog of components registered with the Next.js engine. Each
     * entry is the engine-native `ComponentRegisterConfig` so consumers can
     * read properties, interactions, childrenTypes, etc. Adapters live in
     * downstream modules (e.g. `features/component-palette` projects this
     * onto a leaner palette shape).
     */
    componentsRegistered: ComponentRegisterConfig[]
    setComponentsRegistered: (components: ComponentRegisterConfig[]) => void
    /** Fetches the catalog from the engine; idempotent across calls. */
    loadRegistryComponent: () => Promise<ComponentRegisterConfig[]>
    isLoading: boolean
}

const EngineCatalogContext = createContext<EngineCatalogContextType | undefined>(undefined)

export const EngineCatalogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
            setComponentsRegistered((prev) => {
                // Skip update if same length and same names — avoids cascading
                // re-renders when multiple PageBuilder tabs trigger registration
                // with identical results.
                if (prev.length === components.length) {
                    const sameContent = prev.every((c, i) => c.name === components[i]?.name)
                    if (sameContent) return prev
                }
                return components
            })
            return components
        } catch (error) {
            console.error('[EngineCatalog] failed to load components:', error)
            return []
        } finally {
            setIsLoading(false)
        }
    }, [])

    return (
        <EngineCatalogContext.Provider
            value={{
                componentsRegistered,
                setComponentsRegistered,
                loadRegistryComponent,
                isLoading
            }}
        >
            {children}
        </EngineCatalogContext.Provider>
    )
}

export const useEngineCatalog = (): EngineCatalogContextType => {
    const context = useContext(EngineCatalogContext)
    if (context === undefined) {
        throw new Error('useEngineCatalog must be used within an EngineCatalogProvider')
    }
    return context
}
