/**
 * Public API — shared shadcn-flavoured component palette.
 *
 * Used by the Specification Prototype builder today (M4.28). Lifted to
 * `features/` so future generators can reuse the same vocabulary and
 * persistence shape without duplicating the catalog.
 */

export { PALETTE, PALETTE_BY_ID } from './catalog'
export type { PaletteCategory, PaletteComponent } from './catalog'

export {
    readPersistedComponentIds,
    writePersistedComponentIds
} from './persistence'
export type { ComponentPersistenceOptions } from './persistence'
