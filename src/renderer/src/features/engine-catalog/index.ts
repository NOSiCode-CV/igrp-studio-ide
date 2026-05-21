/**
 * Public API — shared loader for the Next.js engine's component catalog.
 *
 * Used by the UI generator (visual page builder palette) and the Prototype
 * generator (AI design-intent palette). Mount the provider once near the
 * root of any generator that needs catalog access.
 *
 * Exposes both the new semantic names (`EngineCatalogProvider`,
 * `useEngineCatalog`) and back-compat aliases (`ComponentsProvider`,
 * `useComponentsContext`) so existing UI-generator code continues to
 * work without an import rewrite at every call site.
 */

import { EngineCatalogProvider, useEngineCatalog } from './EngineCatalogProvider'

export {
    EngineCatalogProvider,
    useEngineCatalog,
    type EngineCatalogContextType
} from './EngineCatalogProvider'

// Back-compat aliases — same symbols, friendlier names for callers that
// were written before the rename. New code should prefer the canonical
// names above.
export const ComponentsProvider = EngineCatalogProvider
export const useComponentsContext = useEngineCatalog
