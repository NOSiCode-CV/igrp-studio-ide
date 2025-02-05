import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { IColumnsTabelProps } from '../../types/Interfaces';
import useToast from '@renderer/components/useToast';
import {
    getTablesColumns,
    TabList,
    TemplateOptions,
    initialValues,
} from './config';
import { DTOConfig } from '@igrp/spring-engine/dist/interfaces/types';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDtoValidation } from './validation';
import { Card } from '@renderer/components/ui/card';
import { addNewRow, changeValue, removeRow } from '../../helpers';
import { SelectInput, TextInput } from '../../components/inputs-form';
import NavigationBar from '../../components/navigation-bar';
import AttributesCard from './attributes';
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants';
import { useGit } from '@renderer/hooks/useGit';
import { useTabs } from '@renderer/components/TabContext';

interface DtoProps {
    basePath: string;
    selectors: Array<any>;
    models?: Array<any>;
    dto?: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
    onUpdateTab: (newId: string) => void;
}

const DtoLayout = ({
    basePath,
    selectors,
    dto,
    models,
    currentItem,
    onCloseTab,
    onUpdateTab,
}: DtoProps): JSX.Element => {
    const { initializeTabFromCurrentItem } = useTabs();

    const dispatch: any = useDispatch();

    const { createGitCommit } = useGit();

    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();
    const [data, setData] = useState<any>(null);

    const [tablesColumns, setTableColumns] = useState<{
        [key: string]: IColumnsTabelProps[];
    }>({});
    const validationSchema = useDtoValidation({ t });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: async (values) => {
            await handleSave(values);
        },
    });

    useEffect(() => {
        const getJsonData = async () => {
            if (!currentItem) return;

            try {
                const data = await window.api.getJsonContent(currentItem.path);
                setData(data);
            } catch (error) {
                console.error('Failed to load JSON content:', error);
            }
        };

        getJsonData();
    }, [currentItem]);

    useEffect(() => {
        if (data) {
            const { name, template, attributes } = data;
            formik.setFieldValue('name', name || '');
            formik.setFieldValue('template', template || '');
            formik.setFieldValue(
                'attributes',
                attributes || initialValues.attributes
            );
        } else {
            formik.resetForm();
        }
    }, [data]);

    useEffect(() => {
        const columns = getTablesColumns({
            selectors,
            dto,
            models,
            currentDto: data?.name,
            t
        });
        setTableColumns(columns);
    }, [selectors, dto, models, data]);

    const handleSave = async (newValues: DTOConfig): Promise<void> => {
        try {
            const { error } = await window.api.createDto(
                { ...newValues, module: currentItem?.module || 'shared' },
                basePath
            );

            console.log(newValues, error);

            if (error) {
                return showErrorToast(error);
            }

            createGitCommit(basePath, `Add dto ${newValues.name}`);

            dispatch(onSetChangeStatus(true));

            onUpdateTab(formik.values.name);

            showSuccessToast(
                t('createdSuccess', { name: t('dto'), value: newValues.name })
            );
        } catch (error) {
            showErrorToast(error);
        }
    };

    const handleDelete = async (): Promise<void> => {
        try {
            const config = {
                name: formik.values.name,
                type: 'dto',
                module: currentItem.module,
            };

            const { error } = await window.engine.delete(
                config,
                ENV_TYPES.SPRING,
                basePath
            );

            if (error) return showErrorToast(error);

            createGitCommit(basePath, `Delete dto ${formik.values.name}`);

            dispatch(onSetChangeStatus(true));
            onCloseTab();
            showSuccessToast(t('deletedSuccess', { name: t('dto') }));
        } catch (error) {
            showErrorToast(error);
        }
    };

    const onClickSourceCode = () => {
        initializeTabFromCurrentItem({
            path: `${currentItem.path}`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${currentItem.label}.json`,
        });
    };

    const renderFormList = (value: string) => {
        const columns = tablesColumns?.[value];
        const data = formik?.values?.[value];
        const errors = formik?.errors?.[value];

        const dValues = initialValues.attributes[0];

        if (columns && data) {
            return (
                <AttributesCard
                    columns={columns}
                    formik={formik}
                    dto={dto}
                    models={models}
                    currentDto={data?.name}
                    data={data}
                    selectors={selectors}
                    errors={errors}
                    addRow={() => addNewRow(formik, value, dValues)}
                    removeRow={(position) => removeRow(formik, value, position)}
                    changeValue={(element, position, result) => {
                        const isType = element === 'type';

                        const typeValue = isType ? result.value : result;

                        const typeType = isType ? result.type : '';

                        if (isType)
                            formik.setFieldValue(
                                value,
                                formik.values[value].map(
                                    (row: any, index: number) =>
                                        index === position
                                            ? {
                                                  ...row,
                                                  ['objectType']: typeType,
                                                  [element]: typeValue,
                                              }
                                            : row
                                )
                            );
                        else
                            changeValue(
                                formik,
                                element,
                                position,
                                typeValue,
                                value
                            );
                    }}
                />
            );
        }
        return null;
    };

    return (
        <React.Fragment>
            <NavigationBar
                onDelete={handleDelete}
                onSubmit={formik.handleSubmit}
                showSourceCode={onClickSourceCode}
                isNew={!data}
                title={t('dto')}
            />
            <div className="space-y-4 p-4">
                <Card className="rounded-sm p-6">
                    <div className="flex flex-col gap-4">
                        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">
                            <TextInput
                                label={t('name')}
                                id="name"
                                placeholder={t('enterName')}
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                    formik.touched.name
                                        ? formik.errors.name
                                        : undefined
                                }
                                isRequired
                            />
                            <SelectInput
                                label={'Template'}
                                id="template"
                                options={TemplateOptions}
                                value={formik.values.template}
                                onChange={(option) =>
                                    formik.setFieldValue('template', option)
                                }
                                error={formik.errors.template}
                                isRequired
                            />
                        </div>
                        {TabList.map(({ value }) => (
                            <Card className="rounded-sm" key={value}>
                                {renderFormList(value)}
                            </Card>
                        ))}
                    </div>
                </Card>
            </div>
        </React.Fragment>
    );
};

export default DtoLayout;
