import React, { useEffect, useState } from 'react';
import { addNewRow, changeValue, removeRow } from '../../helpers';
import { FormList } from '../../components/form-list';
import {
    IGRPTabs,
    IGRPTabsContent,
    IGRPTabsList,
    IGRPTabsTrigger,
} from '@renderer/components/tabs';
import { JSONSchema } from '../../types/schema';
import { BodyRequest } from './body-request';

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
    const [bodyType, setBodyType] = useState<
        'none' | 'multipart/form-data' | 'json'
    >('none');

    const [contentType, setContentType] = useState('application/json');

    const tabQueryParams = 'requestParams';
    const tabPathVariables = 'pathVariables';
    const tabHeaders = 'headers';

    const columnsQuery = tablesColumns[tabQueryParams];
    const columnsVariables = tablesColumns[tabPathVariables];
    const columnsHeaders = tablesColumns[tabHeaders];

    const [localSchema, setLocalSchema] = useState({
        type: 'Object',
        properties: {},
    });

    const properties = [
        {
            type: '',
            name: '',
            value: '',
            isRequired: true,
        },
    ];

    useEffect(() => {
        // Clear formik values for body content when type changes
        if (bodyType === 'none') {
            formik.setFieldValue('requestBody', '');
        } else if (bodyType === 'multipart/form-data') {
            const content = {
                'multipart/form-data': {
                    schema: localSchema,
                },
            };

            formik.setFieldValue('requestBody', { content });
        } else
            formik.setFieldValue('requestBody', {
                content: {
                    [contentType]: {
                        schema: localSchema,
                    },
                },
            });
    }, [bodyType]);

    const handleSchemaChange = (newSchema: JSONSchema) => {
        const currentSchema = formik.values.requestBody?.content[contentType];

        // Se o schema for o mesmo, não faça nada
        if (
            (currentSchema &&
                JSON.stringify(currentSchema.schema) ===
                    JSON.stringify(newSchema)) ||
            bodyType === 'none'
        ) {
            return; // Não há mudanças, então não faça nada
        }

        const content = {
            [contentType]: {
                schema: newSchema,
            },
        };

        setLocalSchema(newSchema)

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
                    <BodyRequest
                        bodyType={bodyType}
                        setBodyType={setBodyType}
                        contentType={contentType}
                        setContentType={setContentType}
                        formik={formik}
                        contentTypes={contentTypes}
                        schemaTypes={schemaTypes}
                        properties={properties}
                        columnsBody={tablesColumns['requestBody']}
                        handleSchemaChange={handleSchemaChange}
                        handleChangeEditor={handleChangeEditor}
                    />
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
