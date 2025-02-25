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
import { useTranslation } from 'react-i18next';

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
        'none' | 'multipart/form-data' | 'application/json'
    >();

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

    useEffect(() => {
        const type =
            formik.values.requestBody?.content &&
            Object.keys(formik.values.requestBody.content)?.[0];
        if (type !== bodyType) setBodyType(type || 'none');
    }, [formik.values.requestBody]);

    useEffect(() => {
        // Clear formik values for body content when type changes
        if (bodyType === 'none') {
            formik.setFieldValue('requestBody', '');
        } else if (bodyType === 'multipart/form-data') {
            const data =
                formik.values.requestBody?.content?.[bodyType]?.schema ||
                localSchema;
            const content = {
                'multipart/form-data': {
                    schema: data,
                },
            };

            formik.setFieldValue('requestBody', { content });
        } else if (bodyType === 'application/json') {
            const data =
                formik.values.requestBody?.content?.[bodyType]?.schema ||
                localSchema;
            formik.setFieldValue('requestBody', {
                content: {
                    [contentType]: {
                        schema: data,
                    },
                },
            });
        }
    }, [bodyType]);

    const handleSchemaChange = (newSchema: JSONSchema) => {
        const currentSchema = formik.values.requestBody?.content[contentType];

        // Garantir que há propriedades antes de acessar
        const properties = newSchema.properties || {};
        const firstKey = Object.keys(properties)[0];

        // Se houver pelo menos uma propriedade, extraia o schema, senão mantenha o original
        const extractedSchema = firstKey ? properties[firstKey] : newSchema;

        if (
            currentSchema &&
            JSON.stringify(currentSchema.schema) ===
                JSON.stringify(extractedSchema)
        ) {
            return; // Não há mudanças, então não faça nada
        }

        const content = {
            [contentType]: {
                schema: extractedSchema,
            },
        };

        setLocalSchema(newSchema);

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
                    <IGRPTabsTrigger value="params">
                        {t('params')}
                    </IGRPTabsTrigger>
                    <IGRPTabsTrigger value="body">{t('body')}</IGRPTabsTrigger>
                    <IGRPTabsTrigger value="headers">
                        {t('headers')}
                    </IGRPTabsTrigger>
                </IGRPTabsList>
                <IGRPTabsContent value="params">
                    {columnsQuery && (
                        <div className="space-y-3">
                            <p className="text-sm">{t('queryParameters')}</p>
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
                                btnLabels={t('queryParameter')}
                                name={tabQueryParams}
                            />
                            <p className="text-sm">{t('variables')}</p>
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
                                btnLabels={t('variable')}
                                name={tabPathVariables}
                            />
                        </div>
                    )}
                </IGRPTabsContent>
                <IGRPTabsContent value="body">
                    <BodyRequest
                        bodyType={bodyType}
                        contentType={contentType}
                        formik={formik}
                        contentTypes={contentTypes}
                        schemaTypes={schemaTypes}
                        columnsBody={tablesColumns['requestBody']}
                        handleSchemaChange={handleSchemaChange}
                        handleChangeEditor={handleChangeEditor}
                        setLocalSchema={setLocalSchema}
                        setContentType={setContentType}
                        setBodyType={setBodyType}
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
                            btnLabels={t('headers')}
                            name={tabHeaders}
                        />
                    )}
                </IGRPTabsContent>
            </IGRPTabs>
        </>
    );
};
