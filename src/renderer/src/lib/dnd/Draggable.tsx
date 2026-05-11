/**
 * UI-generator adapter — `Draggable` pinned to `StructuredComponent`.
 *
 * Existing call-sites import `from '@renderer/lib/dnd/Draggable'` (or
 * `from '../lib/dnd/Draggable'`); this file keeps that path stable while
 * delegating the implementation to the generic primitive in
 * `@renderer/features/dnd`.
 */

import GenericDraggable from '@renderer/features/dnd/Draggable'
import type { StructuredComponent } from './types'

const Draggable = GenericDraggable<StructuredComponent>

export default Draggable
