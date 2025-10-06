import React, { useEffect } from 'react';
import { addNewRow, changeValue, removeRow } from '../../helpers';
import { FormList } from '../../../../components/form-list';
import {
    IGRPTabs,
    IGRPTabsContent,
    IGRPTabsList,
    IGRPTabsTrigger,
} from '@renderer/components/tabs';
import { BodyRequest } from './body-request';
import { useTranslation } from 'react-i18next';
import { initialValues } from './config';

interface TabRequestProps {
    formik: any;
    tablesColumns: any;
    contentTypes: any;
    schemaTypes?: { label: string; value: string }[];
    collectionTypes: any;
}

const extractPathParameters = (path: string) => {
    const paramRegex = /\{([^}]+)\}/g;
    const parameters: string[] = [];
    let match;

    while ((match = paramRegex.exec(path)) !== null) {
        parameters.push(match[1]);
    }

    return parameters;
};

export const TabRequest: React.FC<TabRequestProps> = ({
    formik,
    tablesColumns,
    contentTypes,
    schemaTypes,
    collectionTypes,
}) => {
    const { t } = useTranslation();

    const tabQueryParams = 'requestParams';
    const tabPathVariables = 'pathVariables';
    const tabHeaders = 'headers';

    const columnsQuery = tablesColumns[tabQueryParams];
    const columnsVariables = tablesColumns[tabPathVariables];
    const columnsHeaders = tablesColumns[tabHeaders];

    useEffect(() => {
        if (!formik.values.path) return;

        const parameters = extractPathParameters(formik.values.path);
        const newPathVariables = [...formik.values.pathVariables];

        parameters.forEach((param) => {
            const exists = newPathVariables.some((pv) => pv.name === param);

            if (!exists) {
                newPathVariables.push({
                    name: param,
                    type: 'string',
                    value: '',
                    isRequired: true,
                    description: '',
                });
            }
        });

        const filteredVariables = newPathVariables.filter((pv) =>
            parameters.includes(pv.name)
        );

        if (filteredVariables.length !== formik.values.pathVariables.length) {
            formik.setFieldValue('pathVariables', filteredVariables);
        }
    }, [formik.values.path]);

    const hasVariables = formik.values.pathVariables.length > 0;

    return (
        <>
            <IGRPTabs defaultValue="params">
                <IGRPTabsList>
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
                            <div className="border rounded-sm py-0">
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
                                            initialValues.requestParams[0]
                                        )
                                    }
                                    removeRow={(position) =>
                                        removeRow(
                                            formik,
                                            tabQueryParams,
                                            position
                                        )
                                    }
                                    errors={formik.errors[tabQueryParams]}
                                    btnLabels={t('queryParameter')}
                                    name={tabQueryParams}
                                />
                            </div>
                            {hasVariables && (
                                <>
                                    <p className="text-sm">{t('variables')}</p>
                                    <div className="border rounded-sm py-0">
                                        <FormList
                                            formik={formik}
                                            columns={columnsVariables}
                                            data={
                                                formik.values[tabPathVariables]
                                            }
                                            changeValue={(
                                                element,
                                                position,
                                                value
                                            ) =>
                                                changeValue(
                                                    formik,
                                                    element,
                                                    position,
                                                    value,
                                                    tabPathVariables
                                                )
                                            }
                                            errors={
                                                formik.errors[tabPathVariables]
                                            }
                                            name={tabPathVariables}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </IGRPTabsContent>
                <IGRPTabsContent value="body">
                    <BodyRequest
                        formik={formik}
                        contentTypes={contentTypes}
                        schemaTypes={schemaTypes}
                        columnsBody={tablesColumns['requestBody']}
                        collectionTypes={collectionTypes}
                    />
                </IGRPTabsContent>
                <IGRPTabsContent value="headers">
                    <div className="border rounded-sm pb-2">
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
                    </div>
                </IGRPTabsContent>
            </IGRPTabs>
        </>
    );
};
