import { Arguments, ComponentRegisterConfig, CustomFunctionConfig, Import, RegisterState, RuleDefinition, State, TypeDef } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types"
import { StyleComponent } from "@renderer/generators/ui/components/settings/style/types"

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
  source: Source
  destination?: Destination | null
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

export interface DataValue {
  code: string;
  id: string;
}

export interface StructuredComponent {
  id: string
  componentName: string
  tag: string
  label?: string
  type?: string
  allowTypes?: boolean,
  dataType?: string
  properties: {
    className?: string;
    content?: string;
    [key: string]: any;
  };
  childProperties?: {
    [key: string]: any;
  },
  interactions: {
    [key: string]: any;
  },
  dataProperties?: {
    [key: string]: any;
  },
  children: StructuredComponent[],
  data?: {
    [key: string]: {
      state?: State,
      value?: DataValue
    };
  };
  rules?: RuleDefinition[];
  style?: StyleComponent
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
  defaultChildren?: { name: string }[]
  interactions: {
    [key: string]: any;
  }
  allowTypes: boolean
  data?: RegisterState[]
}

export interface EditingComponentParams {
  path?: string;
  component: StructuredComponent;
}

export interface DroppedComponentsContextType {
  setAllComponents: (components: StructuredLayout) => void;

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

  handleUpdateChildComponent: (
    componentId: string,
    updates: Partial<StructuredComponent>
  ) => void;

  removeRow: (rowId: string) => void;
  setEditingComponent: ({ path, component }: EditingComponentParams) => void;
  clearEditingComponent: () => void;
  currentComponent: EditingComponentParams | null;

  components: StructuredLayout;

  //types
  types: TypeDef[];
  addType: (type: TypeDef) => void;
  updateType: (id: string, updates: Partial<TypeDef>) => void;
  removeType: (id: string) => void;
  createOrUpdateType: (newType: TypeDef) => void;
  getTypeByComponentId: (componentId: string) => TypeDef | undefined;
  setAllTypes: (newTypes: TypeDef[]) => void;

  //functions
  functions: CustomFunctionConfig[];
  addFunction: (type: CustomFunctionConfig) => void;
  updateFunction: (
    id: string,
    updates: Partial<CustomFunctionConfig>
  ) => void;
  removeFunction: (id: string) => void;
  setAllFunctions: (newTypes: CustomFunctionConfig[]) => void;

  //states
  states: State[];
  addState: (type: State) => void;
  updateState: (id: string, updates: Partial<State>) => void;
  removeState: (id: string) => void;
  setAllStates: (newTypes: State[]) => void;

  //imoports
  imports: Import[];
  addImport: (type: Import) => void;
  updateImport: (id: string, updates: Partial<Import>) => void;
  removeImport: (id: string) => void;
  setAllImports: (newImports: Import[]) => void;

  //
  setAllArguments: (args: Arguments[]) => void;
  componentArguments: Arguments[]
}