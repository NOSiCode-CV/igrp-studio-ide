/**
 * Generic DnD primitives shared across IGRP Studio generators.
 *
 * The shapes here intentionally know nothing about the manifest model used
 * by the UI generator (`StructuredComponent`, `kbRefs`, etc.). Concrete
 * generators wrap these primitives in their own typed adapters — see
 * `@renderer/lib/dnd` for the UI-generator adapter that pins the type
 * parameter to `StructuredComponent`.
 */

export type LayoutMode = 'vertical' | 'horizontal'
export type DropPosition = 'top' | 'bottom' | 'left' | 'right' | 'inside'

/** Minimal contract a draggable item must satisfy. */
export interface DraggableItem {
    id: string
    /**
     * Optional children — only used to count `countItems` in drop-zone
     * positioning. Tree-shaped manifests use this; flat catalogs leave
     * undefined.
     */
    children?: DraggableItem[]
}

export interface DropZone {
    id: string
    position: DropPosition
    dropTargetId?: string
    cellIndex?: number
    countItems: number
}

export interface SidebarItem {
    id: string
    title: string
    url: string
    items?: {
        id: string
        title: string
        url: string
        isActive?: boolean
    }[]
}

export interface Destination {
    droppableId: string
    index: number
    droppableName?: string
    droppablePath?: string
}

/**
 * `Source` is intentionally permissive — the UI-generator adapter spreads
 * the dropped `StructuredComponent` payload into it, so callers downstream
 * read fields like `properties` / `interactions` / `componentName`. We model
 * those as optional record fields here so the generic primitives don't
 * impose a manifest shape.
 */
export interface Source {
    droppableId: string
    index: number
    label?: string
    properties?: Record<string, unknown>
    interactions?: Record<string, unknown>
    allowTypes?: boolean
    componentName?: string
    [key: string]: unknown
}

export interface DragEndResult<TPayload = unknown> {
    draggableId: string
    type: string
    source: Source & Partial<TPayload>
    destination?: Destination | null
    mode: 'MOVE' | 'DROP'
    position?: DropPosition
}
