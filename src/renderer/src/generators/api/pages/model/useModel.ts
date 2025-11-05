import { FocusEvent, useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useGit } from '@renderer/hooks/use-git';
import { useTabs } from '@renderer/components/navigation/TabContext';
import useStudioAPI from '@renderer/hooks/use-studio-api';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import {
    ModelConfig,
    RelationReference,
} from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants';
import { IColumnsTabelProps } from '../../types/Interfaces';
import {
    defaultValues,
    getTablesColumns,
    initialValues,
    getValuesToSubmit,
} from './config';
import { useModelValidation } from './validation';
import useToast from '@renderer/hooks/useToast';
import { useKeyPress } from '@renderer/hooks/useKeyDown';
import { KeyboardKey } from '@renderer/constants/shortcut';

export const useModel = ({
    selectors,
    currentItem,
}: {
    selectors: Array<any>;
    currentItem: any;
}) => {
    const { createGitCommit } = useGit();
    const { initializeTabFromCurrentItem, handleRenameTab } = useTabs();
    const { showErrorToast, showSuccessToast } = useToast();
    const { models, basePath, config, enums, findModelsByName, getJsonData } =
        useStudioAPI(currentItem?.module);
    const { t } = useTranslation();
    const validationSchema = useModelValidation({ t });
    const dispatch: any = useDispatch();

    const [tablesColumns, setTableColumns] = useState<{
        [value: string]: IColumnsTabelProps[];
    }>({});
    const [data, setData] = useState<any>(null);
    const [enableEntityRevision, setEnableEntityRevision] = useState(false);

    const formik: any = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (_values, actions) => {
            actions.setSubmitting(false);
            handleSave();
        },
    });

    const suggestTableName = async (name: string) => {
        const errors = await formik.validateForm();
        if (errors.name) return '';

        const nameProcessed = name
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');

        return nameProcessed.startsWith('t_')
            ? nameProcessed
            : `t_${nameProcessed}`;
    };

    const handleNameBlur = async (
        e: FocusEvent<HTMLInputElement>
    ): Promise<void> => {
        formik.handleBlur(e);
        const name = e.target.value;

        if (formik.values.tableName) return;
        const value = await suggestTableName(name);
        formik.setFieldValue('tableName', value);
    };

    useEffect(() => {
        const appConfig = config.config as { enableEntityRevision?: boolean };
        setEnableEntityRevision(appConfig.enableEntityRevision || false);
    }, [config]);

    useEffect(() => {
        const { attributes, revision } = formik.values;
        const res = getTablesColumns({
            selectors,
            attributes,
            revision,
            models,
            currentItem,
            enums,
            t,
        });
        setTableColumns(res);
    }, [selectors, formik.values]);

    useEffect(() => {
        const load = async () => {
            await getJsonData(currentItem.path).then(setData);
        };
        load();
    }, [currentItem]);

    useEffect(() => {
        if (!data) {
            formik.resetForm();
            return;
        }

        const {
            revision,
            name,
            tableName,
            attributes,
            crud,
            primaryKey,
            uniqueConstraints,
            indexes,
        } = data;

        const primaryKeyAttributes =
            primaryKey && Array.isArray(primaryKey)
                ? primaryKey.map((pk) => ({
                      ...defaultValues.attributes,
                      ...pk,
                      primaryKey: true,
                  }))
                : [];

        const attributesTransf = attributes.map(({ ...field }) => ({
            ...field,
            nullable: !field.nullable,
        }));

        const mergedAttributes = [...attributesTransf, ...primaryKeyAttributes];
        const constraints =
            uniqueConstraints?.length > 0
                ? uniqueConstraints
                : [defaultValues.uniqueConstraints];
        const indexesTable =
            indexes?.length > 0 ? indexes : [defaultValues.indexes];

        formik.setFieldValue('revision', revision || false);
        formik.setFieldValue('name', name || '');
        formik.setFieldValue('tableName', tableName || '');
        formik.setFieldValue('crud', crud || false);
        formik.setFieldValue(
            'attributes',
            mergedAttributes || [defaultValues.attributes]
        );
        formik.setFieldValue('uniqueConstraints', constraints);
        formik.setFieldValue('indexes', indexesTable);
    }, [data]);

    const handleSave = async (): Promise<void> => {
        try {
            const currentData = await getJsonData(currentItem.path);
            const values = getValuesToSubmit(
                { ...currentData, ...formik.values, id: currentItem.id },
                currentItem?.module || 'shared'
            );
            console.log(values);
            const { error } = await window.engine.createModel(
                values,
                ENV_TYPES.SPRING,
                basePath
            );

            if (error) {
                console.log('error', error);
                showErrorToast(error);
                return;
            }

            await createRelationReference(values);
            dispatch(onSetChangeStatus(true));
            showSuccessToast(
                t('createdSuccess', { name: t('model'), value: values.name })
            );
            handleRenameTab(currentItem.id, values.name);
        } catch (error) {
            showErrorToast(error);
        }
    };

    // Keyboard shortcut for save (Ctrl/Cmd + S)
    useKeyPress(() => {
        handleSave();
    }, [KeyboardKey.save]);

    const createRelationReference = async (values: ModelConfig) => {
        const { attributes, name: entityFrom } = values;

        await Promise.all(
            attributes.map(async (attribute) => {
                const { relation, type, name } = attribute;
                if (type !== 'relation' || !relation) return;

                const {
                    mappedBy,
                    fetchType,
                    type: relationType,
                    entity,
                    cardinality,
                } = relation;
                if (cardinality !== 'twoWay') return;

                const relationReference: RelationReference = {
                    type: relationType,
                    entity: entityFrom,
                    fetchType,
                    fieldName: mappedBy,
                    mappedBy: name,
                    module: currentItem?.module,
                };

                const schemaRef = findModelsByName(entity);
                if (!schemaRef) return;

                try {
                    const modelData = await window.api.getJsonContent(
                        schemaRef.path
                    );
                    const existingRefs = Array.isArray(
                        modelData.relationReference
                    )
                        ? modelData.relationReference
                        : [];

                    const existingIndex = existingRefs.findIndex(
                        (existingRef: any) =>
                            existingRef.fieldName ===
                                relationReference.fieldName &&
                            existingRef.mappedBy === relationReference.mappedBy
                    );

                    let updatedReferences;
                    if (existingIndex >= 0) {
                        updatedReferences = [...existingRefs];
                        updatedReferences[existingIndex] = {
                            ...updatedReferences[existingIndex],
                            ...relationReference,
                        };
                    } else {
                        updatedReferences = [
                            ...existingRefs,
                            relationReference,
                        ];
                    }

                    const updatedModel = {
                        ...modelData,
                        relationReference: updatedReferences,
                    };

                    const { error } = await window.engine.createModel(
                        updatedModel,
                        ENV_TYPES.SPRING,
                        basePath
                    );

                    if (error) showErrorToast(error);
                } catch (error) {
                    console.error('Failed to fetch JSON content:', error);
                }
            })
        );
    };

    const deleteModel = async (): Promise<void> => {
        try {
            const config = {
                name: formik.values.name,
                type: 'model',
                module: currentItem.module,
            };

            const { error } = await window.engine.delete(
                config,
                ENV_TYPES.SPRING,
                basePath
            );
            if (error) return showErrorToast(error);

            dispatch(onSetChangeStatus(true));
            createGitCommit(basePath, `Delete schema ${formik.values.name}`);
            showSuccessToast(t('deletedSuccess', { name: t('model') }));
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
        enableEntityRevision,
        handleSave,
        deleteModel,
        onClickSourceCode,
        handleNameBlur,
    };
};
