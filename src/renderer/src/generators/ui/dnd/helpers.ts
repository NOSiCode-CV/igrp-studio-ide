import { StructuredComponent } from "@renderer/lib/dnd/types";
import { generateId } from "@renderer/utils";
import { ComponentRegisterConfig, State } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";

// Utility function to set default values based on the schemaconst setDefaultProperties = (schema: any): any => {const setDefaultProperties = (schema: any): any => {
export const getDefaultProperties = (schema: any): any => {
    const properties: any = {};

    for (const key in schema) {

        const prop = schema[key];

        if (prop.type === 'array' && !prop.items?.enum) {
            properties[key] = [];
        } else if (prop.type === 'object' && prop.properties) {
            properties[key] = getDefaultProperties(prop.properties); // Recursive call
        } else if (prop.required || prop.default)
            properties[key] = prop.default
    }

    return properties;
};

// Utility function to set default values based on the schema
export const getDefaultInteractions = (schema: any) => {

    const interactions: any = {};
    for (const key in schema) {
        if (schema[key].type === 'object' && schema[key].properties &&
            (schema[key].required || schema[key].required === undefined)) {
            interactions[key] = getDefaultInteractions(schema[key].properties);
        }
        /*  else if (schema[key].type === 'object' && schema[key].properties && schema[key].visible) {
             interactions[key] = getDefaultInteractions(schema[key].properties);
         } */
        else if (schema[key].type === 'array' && !schema[key].items?.enum) {
            interactions[key] = [];
        }
        else if (schema[key].required || schema[key].visible) {
            interactions[key] = /* schema[key].default && schema[key].visible ? schema[key].default.replace(/{{id}}/g, tag || '') : */
                schema[key].default;
        }
    }
    return interactions;
};

export const getRequiredDataSchema = (schema: any): any => {
    const result: any = {};

    // Verifica se é um objeto com propriedades

    for (const index in schema) {

        const tempResult: any = {}

        Object.entries(schema[index].properties).forEach(([key, property]: [string, any]) => {

            // Se for o objeto state que queremos validar
            if (key === 'state' && property.type === 'object' && property.required) {
                if (isState(property.properties))
                    tempResult[key] = {
                        id: property.properties?.id?.default ?? "",
                        type: property.properties?.type?.default ?? "any",
                        name: property.properties?.name?.default ?? "",
                        defaultValue: property.properties?.defaultValue?.default ?? "undefined",
                        imports: property.properties?.imports?.default ?? [],
                        generate: property.properties?.generate?.default ?? true
                    };
                else tempResult[key] = undefined

                result[index] = tempResult;

            }

        });
    }

    return result;
};

function isState(obj: any) {
    return obj?.name && obj?.name?.default && obj?.name?.default !== undefined
}


export const newStructuredComponent = (
    name: string,
    children?: Array<StructuredComponent>,
    componentRegister?: ComponentRegisterConfig,
) => {

    const newRowId = generateId(name);

    const {
        properties: props,
        interactions: interactionsProperties,
        data: dataProperties,
    } = componentRegister || {};

    const data = getRequiredDataSchema(dataProperties);
    const interactions = getDefaultInteractions(interactionsProperties);
    const properties = getDefaultProperties(props);

    const newRow: StructuredComponent = {
        id: newRowId,
        componentName: name,
        label: name,
        properties,
        children: children || [],
        tag: '',
        data,
        interactions,
    };

    return newRow;
};