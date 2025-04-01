import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useGit } from '@renderer/hooks/use-git';
import { useTabs } from '@renderer/components/navigation/TabContext';
import useStudioAPI from '@renderer/hooks/use-studio-api';
import { getId } from '@renderer/utils/helpers';
import { DTOConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants';
import { getTablesColumns, initialValues } from './config';
import { useDtoValidation } from './validation';
import { IColumnsTabelProps } from '../../types/Interfaces';
import useToast from '@renderer/components/useToast';

export const useDto = ({ selectors, currentItem }: { selectors: Array<any>; currentItem: any }) => {
    const { initializeTabFromCurrentItem } = useTabs();
    const { createGitCommit } = useGit();
    const { showErrorToast, showSuccessToast } = useToast();
    const dispatch: any = useDispatch();
    const { models, basePath, dto, enums, getJsonData } = useStudioAPI(currentItem?.module);
    const { t } = useTranslation();

    const [id, setId] = useState<string>('');
    const [data, setData] = useState<any>(null);
    const [tablesColumns, setTableColumns] = useState<{ [key: string]: IColumnsTabelProps[] }>({});

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
        formik.setFieldValue('attributes', attributes || initialValues.attributes);

        if (type === OPTION_TYPE.MODEL) {
            setId(getId());
            const baseAttributeFields = initialValues.attributes[0] ? Object.keys(initialValues.attributes[0]) : [];
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
                mergedAttributes.length ? mergedAttributes : initialValues.attributes
            );
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
        return () => document.removeEventListener('keydown', handleKeyDown);
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

            if (error) return showErrorToast(error);

            createGitCommit(basePath, `Add dto ${newValues.name}`);
            dispatch(onSetChangeStatus(true));
            showSuccessToast(t('createdSuccess', { name: t('dto'), value: newValues.name }));
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

    return {
        formik,
        tablesColumns,
        data,
        id,
        t,
        handleSave,
        handleDelete,
        onClickSourceCode,
    };
};