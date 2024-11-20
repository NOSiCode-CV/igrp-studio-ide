import React, { useEffect, useState } from 'react'
import { FormList } from '../form-list'
import useToast from '@renderer/components/useToast'
import { useFormik } from 'formik'
import { btnLabels, defaultValues, getTablesColumns, TabList, initialValues } from './config'
import { ModelConfig, Relation } from '@igrp/spring-engine/dist/interfaces/types'
import { IColumnsTabelProps } from '../Interfaces'
import { setChangeStatus as onSetChangeStatus } from "@renderer/redux/thunks";
import { useDispatch } from 'react-redux'
import { useModelValidation } from './validation'
import { useTranslation } from 'react-i18next'
import { Card } from '@renderer/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Label } from '@renderer/components/ui/label'
import { addNewRow, changeValue, removeRow } from '../../helpers'
import { TextInput } from '../inputs-form'
import PrimaryKeyTable from './PrimaryKeyTable'
import { Checkbox } from '@renderer/components/ui/checkbox'
import NavigationBar from '../navigation-bar'

interface ModelProps {
    onCancel: () => void
    basePath: string
    module: string
    selectors: Array<any>
    jsonData?: any
    models?: Array<any>
}

const ModelLayout = ({ onCancel, basePath, selectors, jsonData, models, module }: ModelProps): JSX.Element => {

    const { t } = useTranslation()
    const dispatch: any = useDispatch();
    const [tablesColumns, setTableColumns] = useState<{ [value: string]: IColumnsTabelProps[] }>({});
    const { showErrorToast, showSuccessToast } = useToast()

    const validationSchema = useModelValidation({ t })

    const formik: any = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (_values, actions) => {
            actions.setSubmitting(false)
            handleSave()
        }
    })

    const suggestTableName = (name) => {
        return `t_${name.trim().toLowerCase().replace(/\s+/g, '_')}`;
    };

    const handleNameBlur = (e) => {
        formik.handleBlur(e);
        const name = e.target.value;
        if (!formik.values.tableName) {
            formik.setFieldValue('tableName', suggestTableName(name));
        }
    };

    useEffect(() => {
        const res = getTablesColumns({
            selectors,
            attributes: formik.values.attributes,
            models,
            currentModel: formik.values.name
        })
        setTableColumns(res)
    }, [selectors, formik.values])

    useEffect(() => {
        if (jsonData) {
            const { name, tableName, attributes, crud, primaryKey, relations, uniqueConstraints } = jsonData

            const crudValue = crud ? [crud] : [defaultValues.crud];

            const firstNonEmptyGenerationType = attributes.find(attr => attr.generationType)?.generationType || null;

            const primaryKeyAttributes = primaryKey && Array.isArray(primaryKey) ? primaryKey.map((pk) => ({
                ...defaultValues.attributes,
                ...pk,
                primaryKey: true,
            })) : [];

            const attributesTransf = attributes
                .map(({ ...field }) => ({
                    ...field,
                    nullable: !field.nullable
                }));

            const mergedAttributes = [...attributesTransf, ...primaryKeyAttributes];

            const constraints = uniqueConstraints && uniqueConstraints.length > 0 ? uniqueConstraints : [defaultValues.uniqueConstraints]

            formik.setFieldValue('name', name || '')
            formik.setFieldValue('tableName', tableName || '')
            formik.setFieldValue('crud', crudValue)
            formik.setFieldValue('generationType', firstNonEmptyGenerationType)
            formik.setFieldValue('enableCrud', crud?.enabled || false)
            formik.setFieldValue('attributes', mergedAttributes || [defaultValues.attributes])
            formik.setFieldValue('relations', relations || [defaultValues.relations])
            formik.setFieldValue('uniqueConstraints', constraints)

        } else
            formik.resetForm()

    }, [jsonData])

    const getValuesToSubmit = () => {
        const values = { ...formik.values };
        const enableCrud = values.enableCrud || false;
        const generationType = values.generationType;

        delete values.indexes
        delete values.enableCrud
        delete values.generationType

        const relations: Relation[] = values.relations?.filter(rel => rel.relationType !== "") || []

        const uniqueConstraints = values.uniqueConstraints?.filter(rel => rel.name !== "") || []

        const attributes = values.attributes
            .map(({ ...field }) => ({
                ...field,
                length: field.length ? Number(field.length) : null,
                nullable: !field.nullable,
                generationType: field.primaryKey === true ? generationType : ""
            }));

        const primaryKey = values.attributes
            .filter(attribute => attribute.primaryKey === true)
            .map(({ name, type }) => ({
                name,
                type
            }));

        const hasListPk = primaryKey.length > 1 ? true : false

        const filteredAttributes = hasListPk
            ? attributes.filter(attribute => attribute.primaryKey !== true)
            : attributes;

        const newValues: ModelConfig = {
            ...values,
            attributes: filteredAttributes,
            relations,
            uniqueConstraints,
            crud: {
                ...values.crud?.[0],
                enabled: enableCrud,
            },
            primaryKey: hasListPk ? primaryKey : []
        }

        if (!enableCrud && !newValues.crud?.path) delete newValues.crud

        newValues.module = module

        return newValues;

    }

    const handleSave = async (): Promise<void> => {
        try {
            const values = getValuesToSubmit()

            const { error } = await window.api.createModel(values, basePath);

            if (error) {
                showErrorToast(error);
                return;
            }

            dispatch(onSetChangeStatus(true));

            showSuccessToast(`Model ${values.name} have been successfully added.`);

        } catch (error) {
            showErrorToast(error);
        }
    }

    const deleteModel = async (): Promise<void> => {
        try {
            const values = getValuesToSubmit()

            const { error } = await window.api.deleteModel(values, basePath);

            if (error) {
                showErrorToast(error);
                return;
            }

            dispatch(onSetChangeStatus(true));
            onCancel()

            showSuccessToast('Model deleted successfully!')

        } catch (error) {
            showErrorToast(error);
        }
    }

    const handleCancel = () => {
        onCancel();
        formik.resetForm();
    }

    const renderFormList = (value: string) => {
        const columns = tablesColumns?.[value];
        const data = formik?.values?.[value];
        const errors = formik?.errors?.[value];

        if (columns && data) {
            return (
                <FormList
                    columns={columns}
                    data={data}
                    changeValue={(element, position, result) =>
                        changeValue(formik, element, position, result, value)
                    }
                    errors={errors}
                    addRow={value === 'crud' ? undefined : () => addNewRow(formik, value, defaultValues[value])}
                    removeRow={value === 'crud' ? undefined : (position) => removeRow(formik, value, position)}
                    name={btnLabels?.[value] || 'attributes'}
                />
            );
        }
        return null;
    };

    return (
        <React.Fragment>

            <NavigationBar
                onDelete={deleteModel}
                onCancel={handleCancel}
                onSubmit={formik.handleSubmit}
                isNew={jsonData === null}
                title="Model" />

            <div className="space-y-4 p-4">
                <Card className="p-6 rounded-sm">
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="grid grid-cols-4 gap-5">
                                <TextInput
                                    label={t('Name')}
                                    id="name"
                                    placeholder={t('Name of the model')}
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.name ? formik.errors.name : undefined}
                                />

                                <TextInput
                                    label={t('Table Name')}
                                    id="tableName"
                                    placeholder={t('Enter Table Name')}
                                    value={formik.values.tableName}
                                    onChange={formik.handleChange}
                                    onBlur={handleNameBlur}
                                    error={formik.touched.tableName ? formik.errors.tableName : undefined}
                                />
                            </div>
                        </div>
                        <div className="flex">
                            <div className="grid grid-cols-4 gap-5 mb-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="audit"
                                        onCheckedChange={(checked) =>
                                            formik.setFieldValue("audit", checked)
                                        }
                                        checked={formik.values.audit}
                                    />
                                    <Label htmlFor="audit">Audit Model</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="enableCrud"
                                        onCheckedChange={(checked) =>
                                            formik.setFieldValue("enableCrud", checked)
                                        }
                                        checked={formik.values.enableCrud}
                                    />
                                    <Label htmlFor="Crud">Crud</Label>
                                </div>

                            </div>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 rounded-sm">
                    <Tabs defaultValue="attributes">
                        <TabsList className="grid w-full grid-cols-5">
                            {TabList.map(({ label, value }, key) => (
                                <TabsTrigger key={key} value={value}> {label}</TabsTrigger>
                            ))}
                        </TabsList>
                        {TabList.map(({ value }, key) => (
                            <TabsContent key={key} value={value}>
                                <Card className='rounded-sm'>
                                    {value === 'uniqueConstraints'
                                        && <PrimaryKeyTable validation={formik} selectors={selectors} />
                                    }
                                    {renderFormList(value)}
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </Card>
            </div>
        </React.Fragment>
    );
}

export default ModelLayout
