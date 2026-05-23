/**
 * Public API — shared component palette utilities.
 *
 * Used by the Specification Prototype builder (M4.28) and the UI
 * generator's visual page builder. Two sources of palette items:
 *
 *  1. **Static catalog** (`PALETTE`) — curated shadcn-flavoured components
 *     for AI design-intent steering. Lives entirely in renderer state.
 *  2. **Engine catalog** (`useEnginePalette`) — pulled from
 *     `window.engine.getComponent(...)` via `features/engine-catalog`. This
 *     is the source of truth for what the visual page builder can render.
 *
 * Picking between them depends on the surface: AI prompts benefit from the
 * narrow curated set; the visual page builder needs the engine's full
 * registry. Both share group labels and the hidden-component list from
 * `./groups`.
 */

export { PALETTE, PALETTE_BY_ID } from './catalog'
export type { PaletteCategory, PaletteComponent } from './catalog'

export {
    readPersistedComponentIds,
    writePersistedComponentIds
} from './persistence'
export type { ComponentPersistenceOptions } from './persistence'

export { useEnginePalette } from './useEnginePalette'
export type {
    EnginePaletteComponent,
    EnginePaletteGroup,
    UseEnginePaletteResult
} from './useEnginePalette'

export {
    GROUP_LABELS,
    GROUP_COMPONET,
    HIDDEN_COMPONENT_NAMES,
    isHiddenComponent,
    resolveGroupLabel
} from './groups'

export { PaletteComponentCard } from './PaletteComponentCard'
export type { PaletteComponentCardProps } from './PaletteComponentCard'
