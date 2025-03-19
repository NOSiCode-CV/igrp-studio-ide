import React, { useEffect, useState } from 'react';
import { Badge } from '@renderer/components/ui/badge';
import { FormList } from '../../components/form-list';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { IGRPCombobox } from '@renderer/components/combobox';
import { Card, CardContent } from '@renderer/components/ui/card';
import { JSONSchemaBuilder } from '../../components/JSONSchema';
import { JSONSchema } from '../../types/schema';
import MonacoEditor from '@renderer/components/monaco-editor';
import { useTranslation } from 'react-i18next';

type TbodyType = 'none' | 'multipart/form-data' | 'application/json';

interface BodyRequestProps {
    formik: any;
    columnsBody: any;
    contentTypes: { label: string; value: string }[];
    schemaTypes?: { label: string; value: string }[];
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
}) => {
    const { t } = useTranslation();

    const [bodyType, setBodyType] = useState<TbodyType>('none');
    const [contentType, setContentType] = useState('application/json');

    const [data, setData] = useState<any[]>([]);

    const [localSchema, setLocalSchema] = useState({
        type: 'object',
        properties: {},
    });

    const jsonSchemaToArray = (schema: JSONSchema) => {
        return Object.entries(schema?.properties || {}).map(
            ([name, properties]) => {
                return {
                    ...properties,
                    name,
                };
            }
        );
    };

    const getCurrentDataSchema = () => {
        return formik.values.requestBody?.content;
    };

    const updateFormik = (content) => {
        const currentValue = getCurrentDataSchema();

        if (JSON.stringify(currentValue) !== JSON.stringify(content)) {
            formik.setFieldValue(routeFormData, { content });
        }
    };

    useEffect(() => {
        const content = formik.values.requestBody?.content;

        const contentType = Object.keys(content)[0];

        const schema = content?.[contentType]?.['schema'];

        setLocalSchema(schema);

        setBodyType(contentType as TbodyType);

    }, [formik.values.requestBody]);

    useEffect(()=>{
        const data = jsonSchemaToArray(localSchema);

        if (bodyType === 'multipart/form-data') setData(data);

    },[bodyType])

    const onChangeBody = (element: string, position: number, value: string) => {
        setData((prev) =>
            prev.map((row, index) =>
                index === position ? { ...row, [element]: value } : row
            )
        );
    };

    const handleSchemaChange = (newSchema: JSONSchema) => {
        const content = {
            [contentType]: {
                schema: newSchema,
            },
        };

        updateFormik(content);
    };

    const handleChangeEditor = (value: string) => {
    
        const content = {
            [contentType]: {
                schema: JSON.parse(value)
            },
        };
        console.log(content)
        updateFormik(content)
    };

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

    return (
        <div>
            <div className="mb-4">
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
                            bodyType === 'application/json'
                                ? 'default'
                                : 'outline'
                        }
                        className="cursor-pointer"
                    >
                        {t('json')}
                    </Badge>
                </div>
            </div>
            {bodyType === 'none' && (
                <div className="text-center rounded p-8 border">
                    <p className="text-muted-foreground text-xs">
                        {t('noBodyParameters')}
                    </p>
                </div>
            )}
            {bodyType === 'multipart/form-data' && data && columnsBody && (
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
            )}
            {bodyType === 'application/json' && (
                <div className="space-y-3">
                    <IGRPCombobox
                        value={contentType}
                        placeholder={t('selectContentType')}
                        onChange={(value) => setContentType(value)}
                        options={contentTypes}
                        className="w-1/3 focus:ring-igrp focus:border-igrp h-8"
                    />
                    <Card className="rounded">
                        <CardContent className="p-3">
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
                                        content={JSON.stringify(
                                            localSchema,
                                            null,
                                            2
                                        )}
                                        filePath=""
                                        onChange={handleChangeEditor}
                                        height="20vh"
                                        language="json"
                                    />
                                </TabsContent>
                                <TabsContent value="schema">
                                    <JSONSchemaBuilder
                                        schemaTypes={schemaTypes}
                                        initialSchema={localSchema || null}
                                        onSchemaChange={handleSchemaChange}
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
