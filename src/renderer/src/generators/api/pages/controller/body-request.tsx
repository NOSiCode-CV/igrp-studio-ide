import React, { useEffect, useMemo, useState } from 'react';
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
    const { t } = useTranslation();

    const routeFormData =
        'requestBody.content.multipart/form-data.schema';

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
        const schema =
            formik.values.requestBody?.content?.[contentType]?.schema;

        return schema && schema.name
            ? {
                  type: '',
                  properties: {
                      [schema.name]: schema,
                  },
              }
            : null;
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

    const handleChangeEditor = (_value: string) => {};

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
                                            formik.values.requestBody
                                                ?.content?.[contentType]
                                                ?.schema,
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
