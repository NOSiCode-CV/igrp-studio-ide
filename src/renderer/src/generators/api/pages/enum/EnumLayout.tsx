import { Input } from '@renderer/components/ui/input';
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { addNewRow, changeValue, removeRow } from '../../helpers';
import { useEffect, useState } from 'react';
import NavigationBar from '../../components/navigation-bar';
import { useDispatch } from 'react-redux';
import useToast from '@renderer/components/useToast';
import { useTranslation } from 'react-i18next';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { FormList } from '../../components/form-list';
import { defaultValue, getTablesColumns, initialValues } from './config';
import { IColumnsTabelProps } from '../../types/Interfaces';
import { EnumValue } from '@igrp/spring-engine/dist/interfaces/types';
import { useGit } from '@renderer/hooks/useGit';
import { useTabs } from '@renderer/components/navigation/TabContext';
import { LabelRequired } from '@renderer/components/required';

interface EnumProps {
    basePath: string;
    selectors: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
}

const validationSchema = Yup.object({
    name: Yup.string()
        .required('Name is required')
        .max(50, 'Name must be less than 50 characters'),
});

export const EnumLayout = ({
    basePath,
    selectors,
    currentItem,
    onCloseTab,
}: EnumProps) => {
    const dispatch: any = useDispatch();
    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();
    const { createGitCommit } = useGit();
    const { initializeTabFromCurrentItem } = useTabs();
    const [title, setTitle] = useState('');

    const [data, setData] = useState<any>(null);
    const [tablesColumns, setTableColumns] = useState<{
        [value: string]: IColumnsTabelProps[];
    }>({});

    const formik = useFormik({
        enableReinitialize: true,
        initialValues, // Use the passed-in initial values
        validationSchema,
        onSubmit: (_values, actions) => {
            actions.setSubmitting(false);
            handleSave(); // Pass values to the save handler
        },
    });

    const getJsonData = async () => {
        if (!currentItem) return;

        try {
            const data = await window.api.getJsonContent(currentItem.path);
            console.log(data);
            setData(data);
        } catch (error) {
            console.error('Failed to load JSON content:', error);
        }
    };

    useEffect(() => {
        getJsonData();
    }, []);

    useEffect(() => {
        if (data) {
            setTitle(data.name);
            formik.setValues(data);
        }
    }, [data]);

    const onSubmit = async () => {
        const errors = await formik.validateForm();
        if (Object.keys(errors).length === 0) {
            formik.handleSubmit();
        } else {
            // Handle validation errors (optional)
            console.error('Validation errors:', errors);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSave();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleSave = async (): Promise<void> => {
        try {
            const data = { ...formik.values, module: currentItem.module };

            const convertedValues: EnumValue[] = data.values.map(
                ({ name, code, description }) => ({
                    name,
                    attributes: [code, description].filter(Boolean),
                })
            );

            const attributes = tablesColumns[tableName].map(
                ({ type, name }) => {
                    return { type: type === 'text' ? 'string' : type, name };
                }
            );
            const values = { ...data, values: convertedValues, attributes };

            const { error } = await window.engine.createEnum(
                values,
                ENV_TYPES.SPRING,
                basePath
            );

            if (error) {
                showErrorToast(error);
                return;
            }

            createGitCommit(basePath, `Add enum ${formik.values.name}`);

            dispatch(onSetChangeStatus(true));

            showSuccessToast(
                t('createdSuccess', { name: t('enum'), value: values.name })
            );
        } catch (error: unknown) {
            showErrorToast(error);
        }
    };

    const handleDelete = async (): Promise<void> => {
        try {
            const config = {
                name: formik.values.name,
                type: 'response',
                module: currentItem.module,
                id: currentItem.id,
            };

            const { error } = await window.engine.delete(
                config,
                ENV_TYPES.SPRING,
                basePath
            );

            if (error) {
                showErrorToast(error);
                return;
            }

            createGitCommit(basePath, `Delete enum ${formik.values.name}`);

            // Notify of successful deletion or update
            dispatch(onSetChangeStatus(true));
            onCloseTab();
            showSuccessToast(t('deletedSuccess', { name: t('response') }));
        } catch (error) {
            showErrorToast(error);
        }
    };

    useEffect(() => {
        const columns = getTablesColumns();
        setTableColumns(columns);
    }, [selectors]);

    const onClickSourceCode = () => {
        initializeTabFromCurrentItem({
            path: `${currentItem.path}`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${currentItem.label}.json`,
        });
    };

    const tableName = 'values';

    return (
        <>
            <NavigationBar
                onDelete={handleDelete}
                onSubmit={onSubmit}
                isNew={!data}
                title={title || t('createNewEnum')}
                showSourceCode={onClickSourceCode}
            />
            <div className="space-y-4 p-4">
                {/* name */}
                <div className="space-y-2">
                    <LabelRequired>{t('name')}</LabelRequired>
                    <Input
                        type="text"
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        className={`w-full  focus:ring-igrp focus:border-igrp ${
                            formik.errors.name && formik.touched.name
                                ? 'border-red-500'
                                : 'border-gray-300'
                        }`}
                    />
                    {formik.errors.name && formik.touched.name && (
                        <div className="text-red-500 text-sm">
                            {formik.errors.name}
                        </div>
                    )}
                </div>
                <FormList
                    columns={tablesColumns.values || []}
                    formik={formik}
                    data={formik.values.values}
                    changeValue={(element, position, result) =>
                        changeValue(
                            formik,
                            element,
                            position,
                            result,
                            tableName
                        )
                    }
                    addRow={() => addNewRow(formik, tableName, defaultValue)}
                    removeRow={(position) =>
                        removeRow(formik, tableName, position)
                    }
                    btnLabels={'Enum'}
                    name={tableName}
                />
            </div>
        </>
    );
};
