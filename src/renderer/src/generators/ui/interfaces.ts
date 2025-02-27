
export interface DroppedComponent {
    id: string; // ID único para o componente dropado
    [key: string]: any;
}

export interface Column {
    id: string; // ID da coluna
    colSize: number;
    components: DroppedComponent[] | []; // Componentes dropados na coluna
}

export interface ComponentData {
    id: string;
    componentName: string;
    label: string;
    config: any;
    children?: ComponentData[];
}

export interface HierarchicalComponent {
    id: string; 
    components: ComponentData[];
}

export interface Destination{
    droppableId: string, index: number
}