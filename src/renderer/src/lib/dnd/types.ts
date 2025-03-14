import { ComponentRegisterConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types"

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
  mode: 'MOVE' | 'DROP'
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
  label?: string
  type?: string
  properties: {
    className?: string;
    content?: string;
    [key: string]: any;
  };
  children: StructuredComponent[]
}

export type StructuredLayout = StructuredComponent

export interface Destination {
  droppableId: string, index: number
}

export interface Source {
  droppableId: string, index: number, label: string,
  properties: {
    className?: string;
    content?: string;
    [key: string]: any;
  };
  childrenTypes?: ComponentRegisterConfig[]
}

export interface EditingComponentParams {
  parentComp?: StructuredComponent;
  component: StructuredComponent;
}

export interface DroppedComponentsContextType {
  addSection: () => StructuredComponent;
  setInitComponents: (components: StructuredLayout) => void;
  getAllComponents: () => StructuredLayout;
  handleAddComponentToRow: (
    destination: Destination,
    childComponent: StructuredComponent
  ) => void;
  handleAddChildToComponent: (
    destination: Destination,
    childComponent: StructuredComponent
  ) => void;
  handleRemoveChildFromComponent: (destination: Destination) => void;
  handleReorderChildInComponent: (
    draggableId: string,
    source: Destination,
    destination: Destination
  ) => void;
  updateComponent: (id: string, updatedComponent: StructuredComponent) => void;
}