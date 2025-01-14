import { Component } from '@igrp/nextjs-engine/dist/interfaces/types';
import { HierarchicalComponent } from '@renderer/generators/ui/interfaces';

export const buildJsonStructure = (components: HierarchicalComponent[]): Component[] => {
    return components.map(row => ({
        Row: [
            {
                Col: row.columns.map(col => ({
                    id: col.id,
                    colSize: col.colSize,
                    components: col.components.map(({ ...comp }) => comp as any),
                    colSize: 4
                })),
            },
        ],
    }));
};
