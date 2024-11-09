import React, { useEffect, useState } from 'react'
import { FormList } from '../FormList'
import useToast from '@renderer/components/useToast'
import { useFormik } from 'formik'
import { btnLabels, defaultValues, getTablesColumns, TabList, initialValues } from './config'
import { ModelConfig, Relation } from '@igrp/spring-engine/dist/interfaces/types'
import { IColumnsTabelProps } from '../Interfaces'

import { setChangeStatus as onSetChangeStatus } from "@renderer/redux/thunks";
import { useDispatch } from 'react-redux'
import FormAction from '../form-actions'
import { useModelValidation } from './validation'
import { useTranslation } from 'react-i18next'
import { Card } from '@renderer/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'

interface ModelProps {
    onCancel: () => void
    basePath: string
    selectors: Array<any>
    jsonData?: any
    models?: Array<any>
}

const ModelLayout = ({ onCancel, basePath, selectors, jsonData, models }: ModelProps): JSX.Element => {

    const { t } = useTranslation()
    const dispatch: any = useDispatch();
    const [tablesColumns, setTableColumns] = useState<{ [value: string]: IColumnsTabelProps[] }>({});
    const { showErrorToast, showSuccessToast } = useToast()

    const validationSchema = useModelValidation({ t })

    const validation: any = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (_values, actions) => {
            actions.setSubmitting(false)
            handleSave()
        }
    })

    const addNewRow = (field: string) => {
        validation.setFieldValue(field, [...validation.values[field], defaultValues[field]])
    }

    const removeRow = (field: string, position: number) => {
        validation.setFieldValue(
            field,
            validation.values[field].filter((_, index: number) => index !== position)
        )
    }

    const changeValue = (element: string, position: number, value: object, name: string) => {
        validation.setFieldValue(
            name,
            validation.values[name].map((row: any, index: number) =>
                index === position ? { ...row, [element]: value } : row
            )
        )
    }

    const suggestTableName = (name) => {
        return `t_${name.trim().toLowerCase().replace(/\s+/g, '_')}`;
    };

    const handleNameBlur = (e) => {
        validation.handleBlur(e);
        const name = e.target.value;
        if (!validation.values.tableName) {
            validation.setFieldValue('tableName', suggestTableName(name));
        }
    };

    useEffect(() => {
        const res = getTablesColumns({
            selectors,
            attributes: validation.values.attributes,
            models,
            currentModel: validation.values.name
        })
        setTableColumns(res)
    }, [selectors, validation.values])

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

            validation.setFieldValue('name', name || '')
            validation.setFieldValue('tableName', tableName || '')
            validation.setFieldValue('crud', crudValue)
            validation.setFieldValue('generationType', firstNonEmptyGenerationType)
            validation.setFieldValue('enableCrud', crud?.enabled || false)
            validation.setFieldValue('attributes', mergedAttributes || [defaultValues.attributes])
            validation.setFieldValue('relations', relations || [defaultValues.relations])
            validation.setFieldValue('uniqueConstraints', constraints)

        } else
            validation.resetForm()

    }, [jsonData])

    const getValuesToSubmit = () => {
        const values = { ...validation.values };
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
        validation.resetForm();
    }

    const renderFormList = (value: string) => {
        const columns = tablesColumns?.[value];
        const data = validation?.values?.[value];
        const errors = validation?.errors?.[value];

        if (columns && data) {
            return (
                <FormList
                    columns={columns}
                    data={data}
                    changeValue={(element, position, result) =>
                        changeValue(element, position, result, value)
                    }
                    errors={errors}
                    addRow={value === 'crud' ? undefined : () => addNewRow(value)}
                    removeRow={value === 'crud' ? undefined : (position) => removeRow(value, position)}
                    name={btnLabels?.[value] || 'attributes'}
                />
            );
        }
        return null;
    };

    return (
        <React.Fragment>

            <FormAction
                onDelete={deleteModel}
                onCancel={handleCancel}
                onSubmit={validation.handleSubmit}
                isNew={jsonData === null}
                title="Model" />

            <div className="space-y-4 p-4">
                <Card className="bg-muted/50 shadow-md p-6 ">
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="grid grid-cols-4 gap-5">
                                <div>
                                    <Label htmlFor="name" className="block text-sm font-medium">Name</Label>
                                    <Input
                                        type="text"
                                        id="name"
                                        className={`mt-1 block w-full px-3 py-2 border ${validation.touched.name && validation.errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                        placeholder="Name of the model"
                                        onChange={validation.handleChange}
                                        onBlur={handleNameBlur}
                                        value={validation.values.name || ""}
                                    />
                                    {validation.touched.name && validation.errors.name && (
                                        <p className="text-sm text-red-500">{validation.errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="tableName" className="block text-sm font-medium">Table Name</Label>
                                    <Input
                                        type="text"
                                        id="tableName"
                                        className={`mt-1 block w-full px-3 py-2 border ${validation.touched.tableName && validation.errors.tableName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                        placeholder="Name of the model"
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.tableName || ""}
                                    />
                                    {validation.touched.tableName && validation.errors.tableName && (
                                        <p className="text-sm text-red-500">{validation.errors.tableName}</p>
                                    )}
                                </div>

                            </div>
                        </div>
                        <div className="flex">
                            <div className="grid grid-cols-4 gap-5 mb-4">
                                <div className='flex align-middle space-x-2'>
                                    <input
                                        type="checkbox"
                                        id="audit"
                                        onChange={validation.handleChange}
                                        value={validation.values.audit}
                                        checked={validation.values.audit}
                                    />
                                    <Label>Audit Model</Label>
                                </div>

                                <div className='flex align-middle space-x-2'>

                                    <input
                                        type="checkbox"
                                        id="enableCrud"
                                        onChange={validation.handleChange}
                                        value={validation.values.enableCrud}
                                        checked={validation.values.enableCrud}
                                    />
                                    <Label htmlFor="tableName">Crud</Label>
                                </div>

                            </div>
                        </div>
                    </div>
                </Card>
                <Card className="bg-muted/50 shadow-md p-6 ">
                    <Tabs defaultValue="attributes">
                        <TabsList className="grid w-full grid-cols-5">
                            {TabList.map(({ label, value }, key) => (
                                <TabsTrigger key={key} value={value}> {label}</TabsTrigger>
                            ))}
                        </TabsList>
                        {TabList.map(({ value }, key) => (
                            <TabsContent key={key} value={value}>
                                <Card>
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
