/**
 * Public API — generic, generator-agnostic DnD primitives.
 *
 * Most consumers in the codebase should import from `@renderer/lib/dnd`,
 * which is the UI-generator adapter that pins these primitives to the
 * `StructuredComponent` manifest model. Reach in here directly only when
 * building a new generator that wants its own typed adapter.
 */

export { default as Draggable } from './Draggable'
export type { DraggableProps } from './Draggable'

export { default as Droppable } from './Droppable'
export type { DroppableContainer, DroppableProps } from './Droppable'

export { DropZone } from './DropZone'
export { DropIndicator } from './drop-indicator'
export { DragProvider, useDragDrop } from './drag-drop-context'

export type {
    Destination,
    DraggableItem,
    DragEndResult,
    DropPosition,
    DropZone as DropZoneState,
    LayoutMode,
    SidebarItem,
    Source
} from './types'
