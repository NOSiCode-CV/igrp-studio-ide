import React, { useEffect, useState } from 'react';
import { addNewRow, changeValue, removeRow } from '../../helpers';
import { FormList } from '../../components/form-list';
import {
    IGRPTabs,
    IGRPTabsContent,
    IGRPTabsList,
    IGRPTabsTrigger,
} from '@renderer/components/tabs';
import { BodyRequest } from './body-request';
import { useTranslation } from 'react-i18next';
import { Card } from '@renderer/components/ui/card';

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

    const tabQueryParams = 'requestParams';
    const tabPathVariables = 'pathVariables';
    const tabHeaders = 'headers';

    const columnsQuery = tablesColumns[tabQueryParams];
    const columnsVariables = tablesColumns[tabPathVariables];
    const columnsHeaders = tablesColumns[tabHeaders];

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
                            <Card className="rounded-sm">
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
                            </Card>
                            <p className="text-sm">{t('variables')}</p>
                            <Card className="rounded-sm">
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
                            </Card>
                        </div>
                    )}
                </IGRPTabsContent>
                <IGRPTabsContent value="body">
                    <BodyRequest
                        formik={formik}
                        contentTypes={contentTypes}
                        schemaTypes={schemaTypes}
                        columnsBody={tablesColumns['requestBody']}
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
