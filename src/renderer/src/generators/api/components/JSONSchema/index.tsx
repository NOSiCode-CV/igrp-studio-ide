import { useState, useCallback, useEffect } from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import { Plus } from 'lucide-react';
import { SchemaFieldRow } from './SchemaFieldRow';
import { JSONSchema, SchemaField } from '../../types/schema';
import { JSONSchemaModal } from './JSONSchemaModal';
import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { TooltipContent } from '@radix-ui/react-tooltip';

interface JSONSchemaBuilderProps {
    schemaTypes?: { label: string; value: string }[];
    enumTypes?: { label: string; value: string }[];
    initialSchema?: JSONSchema | null;
    onSchemaChange?: (schema: JSONSchema) => void;
}

export function JSONSchemaBuilder({
    initialSchema,
    onSchemaChange,
    schemaTypes,
    enumTypes,
}: JSONSchemaBuilderProps) {
    const [newFields, setNewFields] = useState<Record<string, SchemaField>>({});
    const [_alert, setAlert] = useState<string | null>(null);

    const [schema, setSchema] = useState<JSONSchema>(() => {
        if (initialSchema) {
            return {
                ...initialSchema,
                properties: Object.fromEntries(
                    Object.entries(initialSchema.properties || {}).map(
                        ([key, value]) => [key, { ...value }]
                    )
                ),
            };
        }
        return { type: 'object', properties: {} };
    });

    const [fieldOrder, setFieldOrder] = useState<string[]>(() =>
        initialSchema && initialSchema?.properties
            ? Object.keys(initialSchema.properties)
            : []
    );

    useEffect(() => {
        if (initialSchema) {
            setSchema({
                ...initialSchema,
                properties: Object.entries(initialSchema.properties).reduce(
                    (acc, [key, value]) => {
                        acc[key] = { ...value, name: key };
                        return acc;
                    },
                    {} as Record<string, SchemaField>
                ),
            });
            setFieldOrder(Object.keys(initialSchema.properties));
        }
    }, [initialSchema]);

    useEffect(() => {
        if (onSchemaChange) {
            const orderedProperties = fieldOrder.reduce(
                (acc, key) => {
                    if (schema.properties[key]) {
                        acc[key] = schema.properties[key];
                    }
                    return acc;
                },
                {} as Record<string, SchemaField>
            );
            onSchemaChange({ ...schema, properties: orderedProperties });
        }
    }, [schema, fieldOrder, onSchemaChange]);

    const generateUniqueName = (
        baseName: string,
        existingNames: Set<string>
    ): string => {
        let uniqueName = baseName;
        let counter = 1;
        while (existingNames.has(uniqueName)) {
            uniqueName = `${baseName}_${counter}`;
            counter++;
        }
        return uniqueName;
    };

    const checkAndUpdateDuplicateNames = (
        field: SchemaField,
        parentField: SchemaField | null,
        existingNames: Set<string>
    ): SchemaField => {
        const updatedField = { ...field };

        if (parentField) {
            updatedField.name = generateUniqueName(field.name, existingNames);
            existingNames.add(updatedField.name);
        }

        if (
            (updatedField.type === 'object' || updatedField.type === 'array') &&
            updatedField.properties
        ) {
            const propertyNames = new Set<string>();
            updatedField.properties = Object.fromEntries(
                Object.entries(updatedField.properties).map(([_key, value]) => {
                    const updatedValue = checkAndUpdateDuplicateNames(
                        value,
                        updatedField,
                        propertyNames
                    );
                    return [updatedValue.name, updatedValue];
                })
            );
        }

        return updatedField;
    };

    const handleAddNewField = (parentId?: string) => {
        const newFieldName = `New Field ${Object.keys(schema.properties).length + Object.keys(newFields).length + 1}`;

        const newFieldId = `new_field_${Date.now()}`;

        const newField: SchemaField = {
            name: newFieldName,
            type: 'string',
            description: '',
        };

        if (!parentId) {
            setNewFields((prev) => ({ ...prev, [newFieldId]: newField }));
        } else {
            setSchema((prev) => {
                const updateProperties = (
                    properties: Record<string, SchemaField>
                ): Record<string, SchemaField> => {
                    return Object.fromEntries(
                        Object.entries(properties).map(([id, field]) => {
                            if (id === parentId) {
                                if (
                                    field.type === 'object' ||
                                    field.type === 'array'
                                ) {
                                    const updatedProperties = {
                                        ...field.properties,
                                        [newFieldId]: newField,
                                    };
                                    const existingNames = new Set(
                                        Object.keys(updatedProperties)
                                    );
                                    const updatedField = {
                                        ...field,
                                        properties: Object.fromEntries(
                                            Object.entries(
                                                updatedProperties
                                            ).map(([_key, value]) => {
                                                const updatedValue =
                                                    checkAndUpdateDuplicateNames(
                                                        value,
                                                        field,
                                                        existingNames
                                                    );
                                                return [
                                                    updatedValue.name,
                                                    updatedValue,
                                                ];
                                            })
                                        ),
                                    };
                                    return [id, updatedField];
                                }
                            } else if (
                                (field.type === 'object' ||
                                    field.type === 'array') &&
                                field.properties
                            ) {
                                return [
                                    id,
                                    {
                                        ...field,
                                        properties: updateProperties(
                                            field.properties
                                        ),
                                    },
                                ];
                            }

                            return [id, field];
                        })
                    );
                };

                return {
                    ...prev,
                    properties: updateProperties(prev.properties),
                };
            });
        }
    };
    const handleUpdateField = useCallback(
        (
            id: string,
            updatedField: SchemaField,
            isNewField: boolean = false
        ) => {
            const updateProperties = (
                properties: Record<string, SchemaField>
            ): Record<string, SchemaField> => {
                if (id in properties) {
                    const { [id]: _, ...rest } = properties;
                    return {
                        ...rest,
                        [updatedField.name]: {
                            ...updatedField,
                        },
                    };
                }
                return Object.fromEntries(
                    Object.entries(properties).map(([key, field]) => {
                        if (
                            (field.type === 'object' ||
                                field.type === 'array') &&
                            field.properties
                        ) {
                            return [
                                key,
                                {
                                    ...field,
                                    properties: updateProperties(
                                        field.properties
                                    ),
                                },
                            ];
                        }

                        return [key, { ...field }];
                    })
                );
            };

            if (isNewField) {
                if (updatedField.name.trim() !== '') {
                    setSchema((prev) => ({
                        ...prev,
                        properties: {
                            ...prev.properties,
                            [updatedField.name]: updatedField,
                        },
                    }));
                    setFieldOrder((prev) => [...prev, updatedField.name]);
                    setNewFields((prev) => {
                        const { [id]: _, ...rest } = prev;
                        return rest;
                    });
                } else {
                    setNewFields((prev) => ({
                        ...prev,
                        [id]: updatedField,
                    }));
                }
            } else {
                setSchema((prev) => ({
                    ...prev,
                    properties: updateProperties(prev.properties),
                }));

                if (id !== updatedField.name) {
                    setFieldOrder((prev) =>
                        prev.map((field) =>
                            field === id ? updatedField.name : field
                        )
                    );
                }
            }
        },
        []
    );
    const handleDeleteField = useCallback(
        (id: string, isNewField: boolean = false) => {
            if (isNewField) {
                setNewFields((prev) => {
                    const { [id]: _, ...rest } = prev;
                    return rest;
                });
            } else {
                setSchema((prev) => {
                    const deleteFromProperties = (
                        properties: Record<string, SchemaField>
                    ): Record<string, SchemaField> => {
                        if (id in properties) {
                            const { [id]: _, ...rest } = properties;
                            return rest;
                        }
                        return Object.fromEntries(
                            Object.entries(properties).map(([key, field]) => {
                                if (
                                    (field.type === 'object' ||
                                        field.type === 'array') &&
                                    field.properties
                                ) {
                                    return [
                                        key,
                                        {
                                            ...field,
                                            properties: deleteFromProperties(
                                                field.properties
                                            ),
                                        },
                                    ];
                                }
                                return [key, field];
                            })
                        );
                    };

                    return {
                        ...prev,
                        properties: deleteFromProperties(prev.properties),
                    };
                });
            }
        },
        []
    );

    const generateJSONSchema = useCallback(() => {
        const cleanSchema = (obj: any): any => {
            if (Array.isArray(obj)) {
                return obj.map(cleanSchema);
            }
            if (typeof obj === 'object' && obj !== null) {
                const cleaned: any = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (key === 'name' && typeof value === 'object') {
                        cleaned[key] = cleanSchema(value);
                    }
                    if (value !== undefined && value !== '' && key !== 'name') {
                        cleaned[key] = cleanSchema(value);
                    }
                }
                return cleaned;
            }
            return obj;
        };

        const cleanedSchema = cleanSchema({
            ...schema,
            properties: {
                ...schema.properties,
                ...Object.fromEntries(
                    Object.entries(newFields)
                        .filter(([_, field]) => field.name.trim() !== '')
                        .map(([_, field]) => [field])
                ),
            },
        });
        return JSON.stringify(cleanedSchema, null, 2);
    }, [schema, newFields]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right flex flex-1 items-center">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => handleAddNewField()}
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-500 h-6 w-6"
                                    >
                                        <Plus size={14} />
                                        <span className="sr-only">
                                            Add new field
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Add new field</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <JSONSchemaModal
                            generateJSONSchema={generateJSONSchema}
                        />
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {fieldOrder.map((id) => (
                    <SchemaFieldRow
                        key={id}
                        id={id}
                        field={schema.properties[id]}
                        depth={0}
                        onUpdate={(updatedField, _index) =>
                            handleUpdateField(id, updatedField, false)
                        }
                        onDelete={() => handleDeleteField(id, false)}
                        onAddSubfield={handleAddNewField}
                        onAlert={setAlert}
                        schemaTypes={schemaTypes}
                        enumTypes={enumTypes}
                    />
                ))}
                {Object.entries(newFields).map(([id, field]) => (
                    <SchemaFieldRow
                        key={id}
                        id={id}
                        field={field}
                        depth={0}
                        onUpdate={(updatedField) =>
                            handleUpdateField(id, updatedField, true)
                        }
                        onDelete={() => handleDeleteField(id, true)}
                        onAddSubfield={handleAddNewField}
                        onAlert={setAlert}
                        isNew={true}
                        schemaTypes={schemaTypes}
                        enumTypes={enumTypes}
                    />
                ))}
            </TableBody>
        </Table>
    );
}
