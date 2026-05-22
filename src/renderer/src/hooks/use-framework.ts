import { ENV_TYPES } from '@renderer/constants/appConstants'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import type { ProjectData } from 'src/main/types'

interface RootState {
    PageBuilder: {
        config?: ProjectData
    }
}

/**
 * Single source of truth for "which backend engine is the open project using?"
 *
 * Reads `framework` from the active project's config in redux. The string is
 * the same value the user picked in the new-project wizard
 * (`'springboot' | 'dotnet' | 'nextjs'` — see `pages/project/data.ts`) and is
 * passed straight to `window.engine.*` IPC calls, where it lands in the main
 * process's `EngineFactory.getEngine(type)` to dispatch the operation to the
 * matching adapter (`SpringEngine`, `DotNetEngine`, …).
 *
 * Falls back to `ENV_TYPES.SPRING` when no project has been loaded yet, so any
 * incidental render before `setConfig(...)` fires keeps the historical
 * Spring-first behaviour rather than throwing on an unknown engine type.
 */
const selectFramework = createSelector(
    (state: RootState) => state.PageBuilder?.config?.framework,
    (framework): ENV_TYPES => (framework as ENV_TYPES | undefined) ?? ENV_TYPES.SPRING
)

export const useFramework = (): ENV_TYPES => useSelector(selectFramework)
