import React, { useEffect, useState } from 'react';
import { Badge } from '@renderer/components/ui/badge';
import { FormList } from '../../components/form-list';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { Card, CardContent } from '@renderer/components/ui/card';
import { JSONSchemaBuilder } from '../../components/JSONSchema';
import { JSONSchema } from '../../types/schema';
import MonacoEditor from '@renderer/components/monaco-editor';
import { useTranslation } from 'react-i18next';
import { Label } from '@renderer/components/ui/label';
import { Input } from '@renderer/components/ui/input';

type TbodyType = 'none' | 'multipart/form-data' | 'application/json';

interface BodyRequestProps {
    formik: any;
    columnsBody: any;
    contentTypes: { label: string; value: string }[];
    schemaTypes?: { label: string; value: string }[];
    collectionTypes: any;
}

const routeFormData = 'requestBody';

const defaultValue = {
    type: 'string',
    name: 'fieldName',
    value: '',
    isRequired: true,
};

export const BodyRequest: React.FC<BodyRequestProps> = ({
    formik,
    contentTypes,
    schemaTypes,
    columnsBody,
    collectionTypes,
}) => {
    const { t } = useTranslation();

    const [bodyType, setBodyType] = useState<TbodyType>('none');

    const [contentType, setContentType] = useState('application/json');
    const [collectionType, setCollectionType] = useState<string>('none');
    const [name, setName] = useState<string>('');

    const [data, setData] = useState<any[]>([]);

    const [localSchema, setLocalSchema] = useState<any>(null);

    const requestBodyContent = formik.values.requestBody?.content;

    const jsonSchemaToArray = (schema: JSONSchema | null) => {
        return Object.entries(schema?.properties || {}).map(
            ([name, properties]) => {
                return {
                    ...properties,
                    name,
                };
            }
        );
    };

    const updateFormik = (content) => {
        const contentType = Object.keys(content)[0];

        const schema = content?.[contentType]?.['schema'];

        if (JSON.stringify(requestBodyContent) !== JSON.stringify(content)) {
            formik.setFieldValue(routeFormData, {
                ...formik.values.requestBody,
                content,
            });

            setLocalSchema(schema);
        }
    };

    useEffect(() => {
        if (!requestBodyContent) return;

        const contentType = Object.keys(requestBodyContent)[0];

        const schema = requestBodyContent?.[contentType]?.['schema'];

        if (!localSchema) setLocalSchema(schema);

        setBodyType(contentType as TbodyType);
    }, [requestBodyContent]);

    useEffect(() => {
        const data = jsonSchemaToArray(localSchema);
        if (bodyType === 'multipart/form-data') setData(data);
    }, [bodyType]);

    const onChangeBody = (element: string, position: number, value: string) => {
        setData((prev) =>
            prev.map((row, index) =>
                index === position ? { ...row, [element]: value } : row
            )
        );
    };

    const handleSchemaChange = (newSchema: JSONSchema) => {
        const properties = newSchema.properties || {};

        const firstKey = Object.keys(properties)[0];

        const extractedSchema = firstKey ? properties[firstKey] : newSchema;

        const content = {
            [contentType]: {
                schema: extractedSchema,
            },
        };

        updateFormik(content);
    };

    const handleChangeEditor = (value: string) => {
        const content = {
            [contentType]: {
                schema: JSON.parse(value),
            },
        };

        updateFormik(content);
    };

    useEffect(() => {
        const schema = requestBodyContent?.[contentType]?.['schema'];

        const content = {
            [contentType]: {
                schema: {
                    ...schema,
                    collectionType,
                },
            },
        };

        updateFormik(content);
    }, [collectionType]);

    useEffect(() => {
        formik.setFieldValue(routeFormData, {
            ...formik.values.requestBody,
            name,
        });
    }, [name]);

    useEffect(() => {
        if (data.length === 0) return;
        const transformedData = {
            type: 'object',
            properties: data.reduce((acc, row) => {
                const { name, ...rest } = row;
                acc[name] = {
                    ...rest,
                };
                return acc;
            }, {}),
        };

        const content = {
            ['multipart/form-data']: {
                schema: transformedData,
            },
        };

        updateFormik(content);
    }, [data]);

    const getContentToSchemaProps = () => {
        return localSchema
            ? {
                  type: '',
                  properties: {
                      [localSchema?.name]: localSchema,
                  },
              }
            : null;
    };

    const RenderFields = () => (
        <>
            <div className="flex flex-col gap-2 w-full">
                <Label>{t('collectionType')}</Label>
                <IGRPCombobox
                    options={collectionTypes}
                    value={collectionType}
                    onChange={(collectionType) =>
                        setCollectionType(collectionType as string)
                    }
                    className="w-full focus:ring-igrp focus:border-igrp h-9"
                    placeholder={t('selectCollectionType')}
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label>{t('name')}</Label>
                <Input
                    name={t('name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
        </>
    );

    return (
        <div className="flex flex-col gap-4 mt-4">
            <div className="flex space-x-4 text-sm">
                <Badge
                    onClick={() => setBodyType('none')}
                    variant={bodyType === 'none' ? 'default' : 'outline'}
                    className="cursor-pointer"
                >
                    {t('none')}
                </Badge>
                <Badge
                    onClick={() => setBodyType('multipart/form-data')}
                    variant={
                        bodyType === 'multipart/form-data'
                            ? 'default'
                            : 'outline'
                    }
                    className="cursor-pointer"
                >
                    {t('formData')}
                </Badge>
                <Badge
                    onClick={() => setBodyType('application/json')}
                    variant={
                        bodyType === 'application/json' ? 'default' : 'outline'
                    }
                    className="cursor-pointer"
                >
                    {t('json')}
                </Badge>
            </div>
            {bodyType === 'none' && (
                <div className="text-center rounded p-8 border">
                    <p className="text-muted-foreground text-xs">
                        {t('noBodyParameters')}
                    </p>
                </div>
            )}
            {bodyType === 'multipart/form-data' && data && columnsBody && (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        {RenderFields()}
                    </div>
                    <FormList
                        columns={columnsBody}
                        data={data}
                        formik={formik}
                        changeValue={(element, position, value) => {
                            onChangeBody(element, position, value);
                        }}
                        addRow={() => {
                            setData((prev) => [...prev, defaultValue]);
                        }}
                        removeRow={(position) => {
                            setData((prev) =>
                                prev.filter((_row, index) => index !== position)
                            );
                        }}
                        name={routeFormData}
                        btnLabels={t('field')}
                    />
                </>
            )}
            {bodyType === 'application/json' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-2">
                            <Label>{t('contentType')}</Label>
                            <IGRPCombobox
                                value={contentType}
                                placeholder={t('selectContentType')}
                                onChange={(value) =>
                                    setContentType(value as string)
                                }
                                options={contentTypes}
                                className="focus:ring-igrp focus:border-igrp h-8"
                            />
                        </div>
                        {RenderFields()}
                    </div>
                    <Tabs defaultValue="schema">
                        <TabsList>
                            <TabsTrigger value="value">
                                {t('value')}
                            </TabsTrigger>
                            <TabsTrigger value="schema">
                                {t('dataSchema')}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="value">
                            <MonacoEditor
                                content={JSON.stringify(localSchema, null, 2)}
                                filePath=""
                                onChange={handleChangeEditor}
                                height="20vh"
                                language="json"
                            />
                        </TabsContent>
                        <TabsContent value="schema">
                            <div className='border'>
                                <JSONSchemaBuilder
                                    schemaTypes={schemaTypes}
                                    initialSchema={getContentToSchemaProps()}
                                    onSchemaChange={handleSchemaChange}
                                />
                            </div>
                        </TabsContent>
                        
                    </Tabs>
                </div>
            )}
        </div>
    );
};
