import React, { useMemo } from 'react';
import { Badge } from '@renderer/components/ui/badge';
import { FormList } from '../../components/form-list';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Combobox } from '@igrp/igrp-design-system';
import { Card, CardContent } from '@renderer/components/ui/card';
import CodeEditor from '@renderer/components/code-editor';
import { JSONSchemaBuilder } from '../../components/JSONSchema';
import { JSONSchema } from '../../types/schema';

interface BodyRequestProps {
    bodyType: 'none' | 'multipart/form-data' | 'json';
    setBodyType: (type: 'none' | 'multipart/form-data' | 'json') => void;
    contentType: string;
    setContentType: (value: string) => void;
    formik: any;
    contentTypes: { label: string; value: string }[];
    schemaTypes?: { label: string; value: string }[];
    properties: any[];
    columnsBody: any;
    handleSchemaChange: (schema: JSONSchema) => void;
    handleChangeEditor: (value: string) => void;
}

export const BodyRequest: React.FC<BodyRequestProps> = ({
    bodyType,
    setBodyType,
    contentType,
    setContentType,
    formik,
    contentTypes,
    schemaTypes,
    properties,
    columnsBody,
    handleSchemaChange,
    handleChangeEditor,
}) => {

    const content = useMemo(() => {
        return formik.values.requestBody?.content?.[contentType]?.schema;
    }, [formik.values.requestBody, contentType]);
    
    return (
        <div>
            <div className="mb-4">
                <div className="flex space-x-4 text-sm">
                    <Badge
                        onClick={() => setBodyType('none')}
                        variant={bodyType === 'none' ? 'default' : 'outline'}
                        className="cursor-pointer"
                    >
                        None
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
                        Form Data
                    </Badge>
                    <Badge
                        onClick={() => setBodyType('json')}
                        variant={bodyType === 'json' ? 'default' : 'outline'}
                        className="cursor-pointer"
                    >
                        JSON
                    </Badge>
                </div>
            </div>
            {bodyType === 'none' && (
                <div className="text-center rounded p-8 border">
                    <p className="text-muted-foreground text-xs">
                        This request has no body parameters
                    </p>
                </div>
            )}
            {bodyType === 'multipart/form-data' && (
                <FormList
                    columns={columnsBody}
                    data={
                        formik.values['requestBody']?.['multipart/form-data']
                            ?.['properties'] || properties
                    }
                    formik={formik}
                    changeValue={(element, position, value) =>
                        formik.setFieldValue(
                            `requestBody.multipart/form-data.properties[${position}].${element}`,
                            value
                        )
                    }
                    addRow={() => {
                        const newProperties = [...properties, { name: '', value: '' }];
                        formik.setFieldValue(
                            'requestBody.multipart/form-data.properties',
                            newProperties
                        );
                    }}
                    removeRow={(position) => {
                        const updatedProperties = properties.filter(
                            (_, index) => index !== position
                        );
                        formik.setFieldValue(
                            'requestBody.multipart/form-data.properties',
                            updatedProperties
                        );
                    }}
                    errors={formik.errors['requestBody']}
                    name={'requestBody.multipart/form-data.properties'}
                    btnLabels=""
                />
            )}
            {bodyType === 'json' && (
                <div className="space-y-3">
                    <Combobox
                        name="contentType"
                        value={contentType}
                        placeholder="Select Content Type"
                        onChange={(value) => setContentType(value)}
                        options={contentTypes}
                        className="w-1/3 focus:ring-igrp focus:border-igrp h-8"
                    />
                    <Card className="rounded">
                        <CardContent className="p-3">
                            <Tabs defaultValue="value">
                                <TabsList>
                                    <TabsTrigger value="value">Value</TabsTrigger>
                                    <TabsTrigger value="schema">
                                        Data Schema
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="value">
                                    <CodeEditor
                                        value={
                                            JSON.stringify(
                                                formik.values.requestBody?.content?.[contentType]?.schema
                                            )
                                        }
                                        onChange={handleChangeEditor}
                                    />
                                </TabsContent>
                                <TabsContent value="schema">
                                    <JSONSchemaBuilder
                                        schemaTypes={schemaTypes}
                                        initialSchema={content || null}
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