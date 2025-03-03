import { Component } from '@igrp/nextjs-engine/dist/interfaces/types';
import { StructuredLayout } from '@renderer/lib/dnd/types';

export const buildJsonStructure = (components: StructuredLayout): Component[] => {
    return components.map(row => ({
        Row: [
            {
                Col: row.columns.map(col => ({
                    id: col.id,
                    colSize: col.colSize,
                    components: col.components.map(({ ...comp }) => comp as any)
                })),
            },
        ],
    }));
};
