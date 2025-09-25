import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useGit } from '@renderer/hooks/use-git';
import { useTabs } from '@renderer/components/navigation/TabContext';
import useStudioAPI from '@renderer/hooks/use-studio-api';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { EnumValue } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants';
import { IColumnsTabelProps } from '../../types/Interfaces';
import { defaultValue, getTablesColumns, initialValues } from './config';
import useToast from '@renderer/hooks/useToast';

export const useEnum = ({ currentItem }: { currentItem: any }) => {
    const dispatch: any = useDispatch();
    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();
    const { createGitCommit } = useGit();
    const { initializeTabFromCurrentItem, handleRenameTab } = useTabs();
    const { basePath } = useStudioAPI(currentItem?.module);

    const [title, setTitle] = useState('');
    const [data, setData] = useState<any>(null);
    const [tablesColumns, setTableColumns] = useState<{
        [value: string]: IColumnsTabelProps[];
    }>({});

    const validationSchema = Yup.object({
        name: Yup.string()
            .required(t('requiredField'))
            .max(50, t('maxLength', { max: 50 })),
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (_values, actions) => {
            actions.setSubmitting(false);
            handleSave();
        },
    });

    const getJsonData = async () => {
        if (!currentItem) return;
        try {
            const data = await window.api.getJsonContent(currentItem.path);
            setData(data);
        } catch (error) {
            console.error('Failed to load JSON content:', error);
            showErrorToast(t('loadError'));
        }
    };

    useEffect(() => {
        getJsonData();
    }, [currentItem]);

    useEffect(() => {
        if (data) {
            const { name, values } = data;
            setTitle(name);
            formik.setFieldValue('name', name);

            const attributes = values?.map((value: any) => ({
                name: value.name,
                code: value.attributes?.[0] || null,
                description: value.attributes?.[1] || null,
            })) || [defaultValue];

            formik.setFieldValue('values', attributes);
        } else {
            formik.resetForm();
        }
    }, [data]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSave();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSave = async (): Promise<void> => {
        try {
            const convertedValues: EnumValue[] = formik.values.values.map(
                ({ name, code, description }) => ({
                    name,
                    attributes: [code, description].filter(Boolean),
                })
            );

            const attributes =
                tablesColumns.values
                    ?.filter((attr: any) => attr.name !== 'Name')
                    .map(({ type, name }: { type: string; name: string }) => ({
                        type: type === 'text' ? 'string' : type,
                        name,
                    })) || [];

            const values = {
                ...formik.values,
                module: currentItem.module,
                values: convertedValues,
                attributes,
            };

            const { error } = await window.engine.createEnum(
                values,
                ENV_TYPES.SPRING,
                basePath
            );

            if (error) return showErrorToast(error);

            createGitCommit(basePath, `Add enum ${formik.values.name}`);
            dispatch(onSetChangeStatus(true));
            showSuccessToast(
                t('createdSuccess', { name: t('enum'), value: values.name })
            );
            handleRenameTab(currentItem.id, values.name);
        } catch (error) {
            showErrorToast(error);
        }
    };

    const handleDelete = async (): Promise<void> => {
        try {
            const config = {
                name: formik.values.name,
                type: 'enum',
                module: currentItem.module,
            };

            const { error } = await window.engine.delete(
                config,
                ENV_TYPES.SPRING,
                basePath
            );

            if (error) return showErrorToast(error);

            createGitCommit(basePath, `Delete enum ${formik.values.name}`);
            dispatch(onSetChangeStatus(true));
            showSuccessToast(t('deletedSuccess', { name: t('enum') }));
        } catch (error) {
            showErrorToast(error);
        }
    };

    useEffect(() => {
        setTableColumns(getTablesColumns());
    }, []);

    const onClickSourceCode = () => {
        initializeTabFromCurrentItem({
            path: `${currentItem.path}`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${currentItem.label}.json`,
        });
    };

    return {
        formik,
        title,
        data,
        tablesColumns,
        handleSave,
        handleDelete,
        onClickSourceCode,
    };
};
