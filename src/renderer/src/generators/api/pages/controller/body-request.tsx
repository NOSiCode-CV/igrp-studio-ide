import React, { useEffect, useMemo, useState } from 'react';
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
import { JSONSchemaBuilder } from '../../components/JSONSchema';
import { JSONSchema } from '../../types/schema';

interface BodyRequestProps {
    bodyType: 'none' | 'multipart/form-data' | 'application/json' | undefined;
    setBodyType: (
        type: 'none' | 'multipart/form-data' | 'application/json'
    ) => void;
    contentType: string;
    setContentType: (value: string) => void;
    formik: any;
    contentTypes: { label: string; value: string }[];
    schemaTypes?: { label: string; value: string }[];
    columnsBody: any;
    handleSchemaChange: (schema: JSONSchema) => void;
    handleChangeEditor: (value: string) => void;
    setLocalSchema: (schema: any) => void;
}

export const BodyRequest: React.FC<BodyRequestProps> = ({
    bodyType,
    contentType,
    formik,
    contentTypes,
    schemaTypes,
    columnsBody,
    handleSchemaChange,
    setLocalSchema,
    setContentType,
    setBodyType,
}) => {
    const routeFormData =
        'requestBody.content.multipart/form-data.schema.properties';

    const defaultValue = [
        {
            type: '',
            name: '',
            value: '',
            isRequired: true,
        },
    ];

    const [data, setData] = useState([]);

    const content = useMemo(() => {
        return formik.values.requestBody?.content?.[contentType]?.schema;
    }, [formik.values.requestBody, contentType]);

    useEffect(() => {
        if (bodyType === 'multipart/form-data') {
            const schema =
                formik.values.requestBody?.content?.['multipart/form-data']
                    ?.schema;

            const properties: any =
                schema?.properties && Object.keys(schema.properties).length > 0
                    ? Object.values(schema.properties)
                    : [defaultValue];

            setData(properties);

            setLocalSchema(schema);

            if (
                schema?.properties &&
                Object.keys(schema.properties).length === 0
            )
                formik.setFieldValue(routeFormData, defaultValue);
        }
    }, [bodyType, formik.values.requestBody]);

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
                        onClick={() => setBodyType('application/json')}
                        variant={
                            bodyType === 'application/json'
                                ? 'default'
                                : 'outline'
                        }
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
            {bodyType === 'multipart/form-data' && data && columnsBody && (
                <FormList
                    columns={columnsBody}
                    data={data}
                    formik={formik}
                    changeValue={(element, position, value) =>
                        formik.setFieldValue(
                            `${routeFormData}[${position}].${element}`,
                            value
                        )
                    }
                    addRow={() => {
                        formik.setFieldValue(routeFormData, [
                            ...data,
                            defaultValue,
                        ]);
                    }}
                    removeRow={(position) => {
                        const updatedProperties = data.filter(
                            (_, index) => index !== position
                        );
                        formik.setFieldValue(routeFormData, updatedProperties);
                    }}
                    name={routeFormData}
                    btnLabels="Field"
                />
            )}
            {bodyType === 'application/json' && (
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
                                    <TabsTrigger value="value">
                                        Value
                                    </TabsTrigger>
                                    <TabsTrigger value="schema">
                                        Data Schema
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="value">
                                   {/*  <CodeEditor
                                        value={formik.values.requestBody
                                            ?.content?.[contentType]?.schema}
                                        onChange={handleChangeEditor}
                                    /> */}
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
