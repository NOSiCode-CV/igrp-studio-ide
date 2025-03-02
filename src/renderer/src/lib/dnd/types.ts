export type LayoutMode = "vertical" | "horizontal"
export type DropPosition = "top" | "bottom" | "left" | "right" | "inside"

export interface DropZone {
  id: string
  position: DropPosition
  dropTargetId?: string
  cellIndex?: number
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

export interface DragEndResult {
  draggableId: string
  type: string
  source: {
    index: number
    droppableId: string
  }
  destination?: {
    droppableId: string
    index: number
  } | null
}

export interface ComponentConfig {
  gridCol?: number
  type?: string
  name?: string
  label?: string
  placeholder?: string
  colSize?: number
  [key: string]: any
}

export interface StructuredComponent {
  id: string
  componentName: string
  label: string
  type?: string
  props?: Record<string, any>
  children: StructuredComponent[]
}

export interface StructuredRow {
  id: string
  children: StructuredComponent[]
}

export type StructuredLayout = StructuredRow[]

export interface Destination {
  droppableId: string, index: number
}
