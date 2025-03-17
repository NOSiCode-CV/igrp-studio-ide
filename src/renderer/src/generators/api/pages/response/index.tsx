import { Input } from '@renderer/components/ui/input';
import {
    ENV_TYPES,
    httpStatusCodes,
    OPTION_TYPE,
} from '@renderer/constants/appConstants';
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
import { useTabs } from '@renderer/components/navigation/TabContext';
import { LabelRequired } from '@renderer/components/required';
import { SelectInput, TextInput } from '../../components/inputs-form';

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
    const { initializeTabFromCurrentItem } = useTabs();

    const [title, setTitle] = useState('');

    const [dataSchema, setDataSchema] = useState<null | JSONSchema>(null);

    const [data, setData] = useState<any>(null);

    const validationSchema = useResponseValidation({ t });

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
            const values = {
                ...formik.values,
                module: currentItem.module,
                id: currentItem.id,
            };

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
                t('createdSuccess', { name: t('response'), value: values.name })
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
            [contentType]: { schema: newSchema },
        };

        formik.setFieldValue('content', updatedResponses);
    };

    const onClickSourceCode = () => {
        initializeTabFromCurrentItem({
            path: `${currentItem.path}`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${currentItem.label}.json`,
        });
    };

    return (
        <form onSubmit={formik.handleSubmit}>
            <NavigationBar
                onDelete={handleDelete}
                isNew={!data}
                title={title || t('createNewResponse')}
                showSourceCode={onClickSourceCode}
            />
            <div className="space-y-4 p-4">
                <Card className="rounded-sm p-6">
                    <div className="flex flex-col gap-4">
                        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                            {/* HTTP Status Code */}
                            <SelectInput
                                id="statusCode"
                                label={t('httpStatusCode')}
                                options={httpStatusCodes}
                                value={formik.values.statusCode}
                                onChange={(value) => {
                                    formik.setFieldValue('statusCode', value),
                                        handleChangeCode(value);
                                }}
                                onBlur={(value) => {
                                    formik.setFieldValue('statusCode', value),
                                        handleChangeCode(value);
                                }}
                                error={formik.errors.statusCode}
                                isTouched={formik.touched.statusCode}
                                isRequired
                            />
                            {/* Name */}
                            <TextInput
                                type="text"
                                id="name"
                                label={t('name')}
                                value={formik.values.name}
                                error={formik.errors.name}
                                isTouched={formik.touched.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleChange}
                                placeholder={t('responseNamePlaceholder')}
                                isRequired
                            />

                            {/* Content Type */}
                            <div className="flex flex-col gap-3">
                                <LabelRequired>
                                    {t('contentType')}
                                </LabelRequired>
                                <Input
                                    name="contentType"
                                    value={'application/json'}
                                    onChange={() => {}}
                                />
                            </div>
                        </div>
                        {/* Description */}
                        <TextInput
                            type="text"
                            id="description"
                            label={t('description')}
                            value={formik.values.description}
                            error={formik.errors.description}
                            isTouched={formik.touched.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleChange}
                            placeholder={t('description')}
                            className={'w-full'}
                        />
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
                </Card>
            </div>
        </form>
    );
};
