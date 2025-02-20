import { PermissionConfig } from "@igrp/spring-engine/dist/interfaces/types";

export const getTablesColumns = (): { [value: string]: any[] } => {
    return {
        permissions: [
            { key: 'name', name: 'Name', type: 'text' },
            { key: 'description', name: 'Description', type: 'text' },
            { key: 'endpoints', name: 'Endpoints', type: 'MultipleSelector' }
        ]
    };
};

export const defaultInitialValues: PermissionConfig[] = [
    {
        type: "permission",
        name: "",
        description: "",
        endpoints: []
    }
]
