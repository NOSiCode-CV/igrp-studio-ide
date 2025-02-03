import { Combobox } from '@igrp/igrp-design-system';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { ENV_TYPES, httpStatusCodes } from '@renderer/constants/appConstants';
import { useFormik } from 'formik';
import { formatMethods } from '../../helpers';
import { useEffect, useState } from 'react';
import NavigationBar from '../../components/navigation-bar';
import { useDispatch } from 'react-redux';
import useToast from '@renderer/components/useToast';
import { useTranslation } from 'react-i18next';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { getStatusLabel } from '@renderer/utils/helpers';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { JSONSchemaBuilder } from '../../components/JSONSchema';
import { JSONSchema } from '../../types/schema';
import { useResponseValidation } from './validation';

const contentType = 'application/json';

interface ResponseProps {
    basePath: string;
    selectors: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
    onUpdateTab: (newId: string) => void;
}


const initialValues = {
    statusCode: '',
    name: '',
    template: 'classic',
    description: '',
    module: '',
    content: { [contentType]: { schema: {} } },
};

export const ResponseLayout = ({
    basePath,
    selectors,
    currentItem,
    onCloseTab,
    onUpdateTab,
}: ResponseProps) => {
    const dispatch: any = useDispatch();
    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();

    const [title, setTitle] = useState('');

    const [dataSchema, setDataSchema] = useState<null | JSONSchema>(null);

    const [data, setData] = useState<any>(null);

    const validationSchema = useResponseValidation({t})

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
            setDataSchema(data.content[contentType]?.schema as JSONSchema);
            setTitle(data.name);
            formik.setValues(data);
        }
    }, [data]);

    const handleChangeCode = (value) => {
        if (formik.values.name === '')
            formik.setFieldValue('name', getStatusLabel(value));
    };

    const onSubmit = async () => {
        const errors = await formik.validateForm();
        if (Object.keys(errors).length === 0) {
            formik.handleSubmit();
        } else {
            // Handle validation errors (optional)
            console.error('Validation errors:', errors);
        }
    };

    const handleSave = async (): Promise<void> => {
        try {
            const values = { ...formik.values, module: currentItem.module };

            const { error } = await window.engine.createResponse(
                values,
                ENV_TYPES.SPRING,
                basePath
            );

            onUpdateTab(formik.values.name);

            if (error) {
                showErrorToast(error);
                return;
            }

            dispatch(onSetChangeStatus(true));

            showSuccessToast(
                t('createdSuccess', {
                    name: t('response'),
                    value: values.name,
                })
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

            // Notify of successful deletion or update
            dispatch(onSetChangeStatus(true));
            onCloseTab();
            showSuccessToast(t('deletedSuccess', { name: t('response') }));
        } catch (error) {
            showErrorToast(error);
        }
    };

    const schemaTypes = formatMethods(
        (
            selectors.find((selector) => 'SCHEMA_TYPES' in selector) as
                | { SCHEMA_TYPES: string[] }
                | undefined
        )?.SCHEMA_TYPES || []
    );

    const handleSchemaChange = (newSchema: JSONSchema) => {
        // Verificar se o schema realmente mudou antes de atualizar
        const currentSchema = formik.values.content[contentType];

        // Se o schema for o mesmo, não faça nada
        if (
            currentSchema &&
            JSON.stringify(currentSchema.schema) === JSON.stringify(newSchema)
        ) {
            return; // Não há mudanças, então não faça nada
        }

        const updatedResponses = {
            ...formik.values.content,
            [contentType]: {
                schema: newSchema,
            },
        };

        formik.setFieldValue('content', updatedResponses);
    };

    return (
        <>
            <NavigationBar
                onDelete={handleDelete}
                onSubmit={onSubmit}
                isNew={!data}
                title={title || t('createNewResponse')}
            />
            <div className="space-y-4 p-4">
                <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                    {/* HTTP Status Code */}
                    <div className="space-y-2">
                        <Label>{t('httpStatusCode')}</Label>
                        <Combobox
                            options={httpStatusCodes}
                            name="statusCode"
                            value={formik.values.statusCode}
                            onChange={(value) => {
                                formik.setFieldValue('statusCode', value),
                                    handleChangeCode(value);
                            }}
                            className={`w-full h-9 focus:ring-igrp focus:border-igrp ${
                                formik.errors.statusCode &&
                                formik.touched.statusCode
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                            }`}
                            placeholder={t('httpStatusCodePlaceholder')}
                        />
                        {formik.errors.statusCode &&
                            formik.touched.statusCode && (
                                <div className="text-red-500 text-sm">
                                    {formik.errors.statusCode}
                                </div>
                            )}
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label>{t('name')}</Label>
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
                            placeholder={t('responseNamePlaceholder')}
                        />
                        {formik.errors.name && formik.touched.name && (
                            <div className="text-red-500 text-sm">
                                {formik.errors.name}
                            </div>
                        )}
                    </div>

                    {/* Content Type */}
                    <div className="space-y-2">
                        <Label>{t('contentType')}</Label>
                        <Input
                            name="contentType"
                            value={'application/json'}
                            onChange={() => {}}
                        />
                    </div>
                </div>
                {/* Description */}
                <div className="space-y-2">
                    <Label>{t('description')}</Label>
                    <Input
                        type="text"
                        name="description"
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        className={`w-full  focus:ring-igrp focus:border-igrp ${
                            formik.errors.description &&
                            formik.touched.description
                                ? 'border-red-500'
                                : 'border-gray-300'
                        }`}
                    />
                    {formik.errors.name && formik.touched.description && (
                        <div className="text-red-500 text-sm">
                            {formik.errors.description}
                        </div>
                    )}
                </div>
                <Card className="rounded">
                    <CardHeader>
                        <CardTitle>{t('dataSchema')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <JSONSchemaBuilder
                            schemaTypes={schemaTypes}
                            initialSchema={dataSchema}
                            onSchemaChange={(value) => {
                                handleSchemaChange(value);
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
};