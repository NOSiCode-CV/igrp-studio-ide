
export interface DroppedComponent {
    id: string; // ID único para o componente dropado
    [key: string]: any;    
}

export interface Column {
    id: string; // ID da coluna
    colSize: number;
    components: DroppedComponent[] | []; // Componentes dropados na coluna
}

export interface HierarchicalComponent {
    id: string; // ID da linha (row)
    columns: Column[]; // Lista de colunas nessa linha
}

