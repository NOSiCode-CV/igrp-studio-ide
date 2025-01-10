import React, { useState } from 'react';
import { addNewRow, changeValue, removeRow } from '../../helpers';
import { Badge } from '@renderer/components/ui/badge';
import { FormList } from '../../components/form-list';
import {
    IGRPTabs,
    IGRPTabsContent,
    IGRPTabsList,
    IGRPTabsTrigger,
} from '@renderer/components/tabs';
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';
import { TabsContent } from '@radix-ui/react-tabs';
import { Combobox } from '@igrp/igrp-design-system';
import { useTranslation } from 'react-i18next';
import { JSONSchemaBuilder } from '../../components/JSONSchema';
import { JSONSchema } from '../../types/schema';
import { Card, CardContent } from '@renderer/components/ui/card';
import CodeEditor from '@renderer/components/code-editor';

interface TabRequestProps {
    formik: any;
    tablesColumns: any;
    contentTypes: any;
    schemaTypes?: { label: string; value: string }[];
}

export const TabRequest: React.FC<TabRequestProps> = ({
    formik,
    tablesColumns,
    contentTypes,
    schemaTypes,
}) => {
    const { t } = useTranslation();

    const [bodyType, setBodyType] = useState<
        'none' | 'multipart/form-data' | 'json'
    >('none');

    const [contentType, setContentType] = useState('application/json');

    const tabQueryParams = 'requestParams';
    const tabPathVariables = 'pathVariables';
    const tabHeaders = 'headers';
    const tabBody = 'requestBody';

    const columnsQuery = tablesColumns[tabQueryParams];
    const columnsVariables = tablesColumns[tabPathVariables];
    const columnsHeaders = tablesColumns[tabHeaders];
    const columnsBody = tablesColumns[tabBody];

    const properties = [
        {
            type: '',
            name: '',
            value: '',
            isRequired: true,
        },
    ];

    const handleBodyTypeChange = (
        type: 'none' | 'multipart/form-data' | 'json'
    ) => {
        setBodyType(type);

        // Clear formik values for body content when type changes
        if (type === 'none') {
            formik.setFieldValue('requestBody', '');
        } else if (type === 'multipart/form-data') {
            const content = {
                'multipart/form-data': {
                    type: 'Object',
                    properties,
                },
            };

            formik.setFieldValue('requestBody', { content });
        } else formik.setFieldValue('requestBody', { content: {} });
    };

    const handleSchemaChange = (newSchema: JSONSchema) => {
        const currentSchema = formik.values.requestBody?.content[contentType];

        // Se o schema for o mesmo, não faça nada
        if (
            currentSchema &&
            JSON.stringify(currentSchema.schema) === JSON.stringify(newSchema)
        ) {
            return; // Não há mudanças, então não faça nada
        }

        const content = {
            [contentType]: {
                schema: newSchema,
            },
        };

        formik.setFieldValue('requestBody', { content });
    };

    const handleChangeEditor = (value) => {
        const content = {
            [contentType]: {
                schema: value,
            },
        };

        formik.setFieldValue('requestBody', { content });
    };

    return (
        <>
            <IGRPTabs defaultValue="params">
                <IGRPTabsList className="w-full">
                    <IGRPTabsTrigger value="params">Params</IGRPTabsTrigger>
                    <IGRPTabsTrigger value="body">Body</IGRPTabsTrigger>
                    <IGRPTabsTrigger value="headers">Headers</IGRPTabsTrigger>
                </IGRPTabsList>
                <IGRPTabsContent value="params">
                    {columnsQuery && (
                        <div className="space-y-3">
                            <p className="text-sm">Query Parameters</p>
                            <FormList
                                formik={formik}
                                columns={columnsQuery}
                                data={formik.values[tabQueryParams]}
                                changeValue={(element, position, value) =>
                                    changeValue(
                                        formik,
                                        element,
                                        position,
                                        value,
                                        tabQueryParams
                                    )
                                }
                                addRow={() =>
                                    addNewRow(
                                        formik,
                                        tabQueryParams,
                                        tabQueryParams
                                    )
                                }
                                removeRow={(position) =>
                                    removeRow(formik, tabQueryParams, position)
                                }
                                errors={formik.errors[tabQueryParams]}
                                btnLabels={'Query Parameter'}
                                name={tabQueryParams}
                            />
                            <p className="text-sm">Variables</p>
                            <FormList
                                formik={formik}
                                columns={columnsVariables}
                                data={formik.values[tabPathVariables]}
                                changeValue={(element, position, value) =>
                                    changeValue(
                                        formik,
                                        element,
                                        position,
                                        value,
                                        tabPathVariables
                                    )
                                }
                                addRow={() =>
                                    addNewRow(
                                        formik,
                                        tabPathVariables,
                                        tabPathVariables
                                    )
                                }
                                removeRow={(position) =>
                                    removeRow(
                                        formik,
                                        tabPathVariables,
                                        position
                                    )
                                }
                                errors={formik.errors[tabPathVariables]}
                                btnLabels={'Variable'}
                                name={tabPathVariables}
                            />
                        </div>
                    )}
                </IGRPTabsContent>
                <IGRPTabsContent value="body">
                    <div className="mb-4">
                        <div className="flex space-x-4 text-sm">
                            <Badge
                                onClick={() => handleBodyTypeChange('none')}
                                variant={
                                    bodyType === 'none' ? 'default' : 'outline'
                                }
                                className="cursor-pointer"
                            >
                                None
                            </Badge>
                            <Badge
                                onClick={() =>
                                    handleBodyTypeChange('multipart/form-data')
                                }
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
                                onClick={() => handleBodyTypeChange('json')}
                                variant={
                                    bodyType === 'json' ? 'default' : 'outline'
                                }
                                className="cursor-pointer"
                            >
                                JSON
                            </Badge>
                        </div>
                    </div>

                    {bodyType === 'none' && columnsBody && (
                        <div className="text-center rounded p-8 border">
                            <p className="text-muted-foreground text-xs">
                                This request has no body parameters
                            </p>
                        </div>
                    )}

                    {bodyType === 'multipart/form-data' && columnsBody && (
                        <>
                            <FormList
                                columns={columnsBody}
                                data={
                                    formik.values[tabBody][
                                        'multipart/form-data'
                                    ]?.['properties'] || properties
                                }
                                formik={formik}
                                changeValue={(element, position, value) =>
                                    changeValue(
                                        formik,
                                        element,
                                        position,
                                        value,
                                        tabBody
                                    )
                                }
                                addRow={() =>
                                    addNewRow(formik, tabBody, 'formData')
                                }
                                removeRow={(position) =>
                                    removeRow(formik, tabBody, position)
                                }
                                errors={formik.errors[tabBody]}
                                name={
                                    'requestBody.multipart/form-data.properties'
                                }
                                btnLabels=""
                            />
                        </>
                    )}

                    {bodyType === 'json' && (
                        <div className="space-y-3">
                            <Combobox
                                name={t('contentType')}
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
                                            <div className="mt-3">
                                                <CodeEditor
                                                    value={
                                                        formik.values
                                                            .bodyContent?.[
                                                            'content'
                                                        ] || ''
                                                    }
                                                    onChange={
                                                        handleChangeEditor
                                                    }
                                                    className="my-custom-class"
                                                />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="schema">
                                            <JSONSchemaBuilder
                                                schemaTypes={schemaTypes}
                                                initialSchema={null}
                                                onSchemaChange={(value) => {
                                                    handleSchemaChange(value);
                                                }}
                                            />
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </IGRPTabsContent>
                <IGRPTabsContent value="headers">
                    {columnsHeaders && (
                        <FormList
                            formik={formik}
                            columns={columnsHeaders}
                            data={formik.values[tabHeaders]}
                            changeValue={(element, position, value) =>
                                changeValue(
                                    formik,
                                    element,
                                    position,
                                    value,
                                    tabHeaders
                                )
                            }
                            addRow={() =>
                                addNewRow(formik, tabHeaders, tabHeaders)
                            }
                            removeRow={(position) =>
                                removeRow(formik, tabQueryParams, position)
                            }
                            errors={formik.errors[tabHeaders]}
                            btnLabels={tabHeaders}
                            name={tabHeaders}
                        />
                    )}
                </IGRPTabsContent>
            </IGRPTabs>
        </>
    );
};
