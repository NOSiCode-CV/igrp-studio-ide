import { useState, useCallback, useEffect } from 'react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
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
import { useTranslation } from 'react-i18next';

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

    const { t } = useTranslation();

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
        return { type: '', properties: {} };
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
        const orderedProperties = fieldOrder.reduce(
            (acc, key) => {
                if (schema.properties[key]) {
                    acc[key] = schema.properties[key];
                }
                return acc;
            },
            {} as Record<string, SchemaField>
        );
        onSchemaChange?.({ ...schema, properties: orderedProperties });
    }, [schema, fieldOrder, onSchemaChange]);


    const checkAndUpdateDuplicateNames = (field: SchemaField): SchemaField => {
        const updatedField = { ...field };

        if (
            (updatedField.type === 'object' || updatedField.type === 'array') &&
            updatedField.properties
        ) {
            // const propertyNames = new Set<string>();
            updatedField.properties = Object.fromEntries(
                Object.entries(updatedField.properties).map(([_key, value]) => {
                    const updatedValue = checkAndUpdateDuplicateNames(
                        value
                        /*  updatedField,
                        propertyNames */
                    );
                    return [updatedValue.name, updatedValue];
                })
            );
        }

        return updatedField;
    };

    const handleAddNewField = (parentId?: string) => {
        const newFieldName = `field${parentId}${parentId ? Object.keys(schema.properties?.[parentId]?.properties ?? {}).length + 1 : ''}`;
        const newFieldId = `new_field_${Date.now()}`;

        const newField: SchemaField = {
            name: newFieldName,
            type: 'string',
            description: '',
        };

        console.log(newField);

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
                                    /*  const existingNames = new Set(
                                        Object.keys(updatedProperties)
                                    ); */
                                    const updatedField = {
                                        ...field,
                                        properties: Object.fromEntries(
                                            Object.entries(
                                                updatedProperties
                                            ).map(([_key, value]) => {
                                                const updatedValue =
                                                    checkAndUpdateDuplicateNames(
                                                        value
                                                        /*  field,
                                                        existingNames */
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

                const properties = updateProperties(prev.properties);

                return {
                    ...prev,
                    properties,
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
                    const { [id]: oldField, ...rest } = properties; // Remove the old field
                    return {
                        ...rest, // Keep the rest of the properties
                        [updatedField.name]: {
                            // Add the updated field with the new key
                            ...oldField, // Preserve the old field's properties
                            ...updatedField, // Apply updates
                            properties: updatedField.properties
                                ? Object.fromEntries(
                                      Object.entries(
                                          updatedField.properties
                                      ).map(([_key, field]) => [
                                          field.name,
                                          {
                                              ...field,
                                          },
                                      ])
                                  )
                                : undefined, // Update nested properties if they exist
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

                setFieldOrder((prev) =>
                    prev.map((field) =>
                        field === id ? updatedField.name : field
                    )
                );
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

            setFieldOrder(Object.keys(schema.properties));
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
        <TooltipProvider>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('type')}</TableHead>
                        <TableHead>{t('description')}</TableHead>
                        <TableHead className="text-right flex flex-1 items-center">
                            {fieldOrder.length === 0 &&
                                Object.entries(newFields).length === 0 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <IGRPButtonPrimitive
                                                type="button"
                                                onClick={() =>
                                                    handleAddNewField()
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="text-igrp h-6 w-6"
                                            >
                                                <Plus size={14} />
                                                <span className="sr-only">
                                                    {t('addNewField')}
                                                </span>
                                            </IGRPButtonPrimitive>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t('addNewField')}
                                        </TooltipContent>
                                    </Tooltip>
                                )}

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
        </TooltipProvider>
    );
}
