import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { IColumnsTabelProps } from '../../types/Interfaces';
import useToast from '@renderer/components/useToast';
import {
    getTablesColumns,
    TabList,
    TemplateOptions,
    initialValues,
} from './config';
import { DTOConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDtoValidation } from './validation';
import { Card } from '@renderer/components/ui/card';
import { addNewRow, handleChangeValueObject, removeRow } from '../../helpers';
import { SelectInput, TextInput } from '../../components/inputs-form';
import NavigationBar from '../../components/navigation-bar';
import AttributesCard from './attributes';
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants';
import { useGit } from '@renderer/hooks/useGit';
import { useTabs } from '@renderer/components/navigation/TabContext';
import useStudioAPI from '@renderer/hooks/useStudioAPI';
import { getId } from '@renderer/utils/helpers';

interface DtoProps {
    selectors: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
}

const DtoLayout = ({ selectors, currentItem, onCloseTab }: DtoProps) => {
    const { initializeTabFromCurrentItem } = useTabs();

    const dispatch: any = useDispatch();

    const { createGitCommit } = useGit();

    const { models, basePath, dto, enums, getJsonData } = useStudioAPI(
        currentItem?.module
    );

    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();

    const [id, setId] = useState<string>('');
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
        const load = async () => {
            await getJsonData(currentItem.path).then((data) => {
                setData(data);
            });
        };

        load();
    }, [currentItem]);

    useEffect(() => {
        if (!data) {
            formik.resetForm();
            return;
        }
        const { name, template, attributes, type } = data;

        formik.setFieldValue('name', name || '');
        formik.setFieldValue('template', template || '');

        if (type === OPTION_TYPE.MODEL) {
            setId(getId());

            const baseAttributeFields = initialValues.attributes[0]
                ? Object.keys(initialValues.attributes[0])
                : [];

            const baseAttributeDefaults = initialValues.attributes[0] || {};

            const mergedAttributes = attributes.map((attr) => {
                const mergedAttr = { ...baseAttributeDefaults };

                baseAttributeFields.forEach((field) => {
                    if (attr[field] !== undefined) {
                        mergedAttr[field] = attr[field];
                    }
                });

                return mergedAttr;
            });

            formik.setFieldValue(
                'attributes',
                mergedAttributes.length
                    ? mergedAttributes
                    : initialValues.attributes
            );
        } else {
            formik.setFieldValue('attributes', initialValues.attributes);
        }
    }, [data]);

    useEffect(() => {
        const columns = getTablesColumns({
            selectors,
            dto,
            models,
            enums,
            current: data,
            t,
        });
        setTableColumns(columns);
    }, [selectors, dto, models, data]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSave(formik.values);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleSave = async (newValues: DTOConfig): Promise<void> => {
        try {
            const config = {
                ...newValues,
                module: currentItem?.module || 'shared',
                id: id || currentItem.id,
            };

            const { error } = await window.engine.createDto(
                config,
                ENV_TYPES.SPRING,
                basePath
            );

            console.log(config, error);

            if (error) {
                return showErrorToast(error);
            }

            createGitCommit(basePath, `Add dto ${newValues.name}`);

            dispatch(onSetChangeStatus(true));

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
                        handleChangeValueObject(
                            formik,
                            element,
                            position,
                            result,
                            value
                        );
                    }}
                />
            );
        }
        return null;
    };

    return (
        <form onSubmit={formik.handleSubmit}>
            <NavigationBar
                onDelete={handleDelete}
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
                                isTouched={formik.touched.name}
                                error={formik.errors.name}
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
                                onBlur={(option) =>
                                    formik.setFieldValue('template', option)
                                }
                                error={formik.errors.template}
                                isTouched={formik.touched.template}
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
        </form>
    );
};

export default DtoLayout;
