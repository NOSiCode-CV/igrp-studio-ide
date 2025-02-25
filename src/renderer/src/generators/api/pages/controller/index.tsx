import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { IColumnsTabelProps } from '../../types/Interfaces';
import { getTablesColumns, TabList, initialValues } from './config';

import { useDispatch } from 'react-redux';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useActionValidation } from './validation';
import { useTranslation } from 'react-i18next';
import {
    ControllerAction,
    ControllerConfig,
} from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Combobox } from '@igrp/igrp-framework-react-design-system';
import { formatMethods } from '../../helpers';
import { TabRequest } from './tab-resquest';

import useToast from '@renderer/components/useToast';
import NavigationBar from '../../components/navigation-bar';
import { CreateEndpointDialog } from './create-endpoint-dialog';
import { TextInput } from '../../components/inputs-form';
import { TabResponse } from './tab-response';
import {
    ENV_TYPES,
    httpMethods,
    OPTION_TYPE,
} from '@renderer/constants/appConstants';
import { SchemaTypeItem } from 'src/main/types';
import { useGit } from '@renderer/hooks/useGit';
import { useTabs } from '@renderer/components/navigation/TabContext';
import { LabelRequired } from '@renderer/components/required';

interface ControllerProps {
    basePath: string;
    selectors: Array<any>;
    currentItem: any;
    modules: Array<any>;
    dto: Array<any>;
    responses: Array<any>;
    enums: Array<any>;
    onCloseTab: () => void;
    onUpdateTab: (newId: string) => void;
}

const ControllerLayout: React.FC<ControllerProps> = ({
    basePath,
    selectors,
    currentItem,
    modules,
    dto,
    onCloseTab,
    onUpdateTab,
    responses,
    enums,
}: ControllerProps) => {
    const { t } = useTranslation();
    const { createGitCommit } = useGit();
    const { initializeTabFromCurrentItem } = useTabs();

    const [oldActionName, setOldActionName] = useState('');
    const [title, setTitle] = useState('');
    const [name, setName] = useState('');
    const [pathController, setPathController] = useState('');
    const [module, setModule] = useState<string | undefined>();
    const [data, setData] = useState<any>(null);
    const [schemaTypes, setSchemaTypes] = useState<SchemaTypeItem[]>([]);
    const [enumTypes, setEnumTypes] = useState<SchemaTypeItem[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const dispatch: any = useDispatch();

    const [tablesColumns, setTableColumns] = useState<{
        [value: string]: IColumnsTabelProps[];
    }>({});

    const { showErrorToast, showSuccessToast } = useToast();

    const validationSchema = useActionValidation({ t });

    const formik: any = useFormik({
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
        }
    };

    useEffect(() => {
        getJsonData();
    }, [currentItem]);

    useEffect(() => {
        const res = getTablesColumns(selectors, enumTypes, t);
        setTableColumns(res);
    }, [selectors]);

    useEffect(() => {
        if (data) {
            const { name, basePath } = data;

            setTitle(`${name}(${basePath})`);
            setName(name);
            setPathController(basePath);
        }
    }, [data]);

    useEffect(() => {
        if (currentItem && currentItem.content) {
            const {
                actionName,
                path,
                method,
                pathVariables,
                requestParams,
                headers,
                responses,
                requestBody,
            } = currentItem.content;

            setOldActionName(actionName);

            formik.setFieldValue(
                'actionName',
                actionName || initialValues.actionName
            );
            formik.setFieldValue('method', method || initialValues.method);
            formik.setFieldValue('path', path || initialValues.path);
            formik.setFieldValue('requestBody', requestBody || '');
            formik.setFieldValue(
                'pathVariables',
                pathVariables || initialValues.pathVariables
            );
            formik.setFieldValue(
                'requestParams',
                requestParams || initialValues.requestParams
            );
            formik.setFieldValue(
                'responses',
                responses || initialValues.responses
            );
            formik.setFieldValue('headers', headers || initialValues.headers);
        }
        if (currentItem) {
            setModule(currentItem.module);
        }
    }, [currentItem]);

    const getValuesToSubmit = async () => {
        const values = { ...formik.values };

        if (!values.requestBody) delete values.requestBody;

        getJsonData();

        const actionName = oldActionName || values.actionName;

        const validPathVariables =
            values.pathVariables &&
            values.pathVariables.filter((item) => item.type && item.name);

        // Filter out invalid requestParams
        const validRequestParams =
            values.requestParams &&
            values.requestParams.filter((item) => item.type && item.name);

        const validHeaders =
            values.headers &&
            values.headers.filter((item) => item.type && item.header);

        const newAction = {
            ...values,
            pathVariables: validPathVariables,
            requestParams: validRequestParams,
            headers: validHeaders,
        };

        // Check if a matching action exists in data?.actions
        const existingActions = data?.actions || [];
        const isActionExisting = existingActions.some(
            (dataAction) => dataAction.actionName === oldActionName
        );

        // Merge or replace actions
        const mergedActions = existingActions.map((dataAction) =>
            dataAction.actionName === actionName ? newAction : dataAction
        );

        // If no matching action, add the new action
        const finalActions: ControllerAction[] = isActionExisting
            ? mergedActions
            : [...existingActions, newAction];

        const newValues: ControllerConfig = {
            type: 'controller',
            name: name,
            basePath: pathController,
            actions: finalActions,
            module,
            id: currentItem.id,
        };

        return newValues;
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                onSubmit();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleSave = async (): Promise<void> => {
        try {
            const values = await getValuesToSubmit();

            const { error } = await window.api.createController(
                values,
                basePath
            );

            console.log(values, error);

            onUpdateTab(formik.values.name);

            if (error) {
                showErrorToast(error);
                return;
            }

            createGitCommit(basePath, `Add action ${formik.values.actionName}`);

            dispatch(onSetChangeStatus(true));

            showSuccessToast(
                t('createdSuccess', {
                    name: t('controller'),
                    value: values.name,
                })
            );
        } catch (error: unknown) {
            showErrorToast(error);
        }
    };

    const handleDelete = async (): Promise<void> => {
        try {
            const values = await getValuesToSubmit();
            const countActions = values.actions.length;

            if (countActions === 1) {
                const config = {
                    name: formik.values.name,
                    type: 'controller',
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
            } else {
                // Remove only the current action and save the updated actions
                const updatedActions = values.actions.filter(
                    (dataAction) => dataAction.actionName !== formik.actionName
                );

                const updatedValues = { ...values, actions: updatedActions };

                const { error } = await window.api.createController(
                    updatedValues,
                    basePath
                );

                if (error) {
                    showErrorToast(error);
                    return;
                }
            }

            createGitCommit(basePath, `Delete action ${formik.values.name}`);

            // Notify of successful deletion or update
            dispatch(onSetChangeStatus(true));
            onCloseTab();
            showSuccessToast(t('deletedSuccess', { name: t('controller') }));
        } catch (error) {
            showErrorToast(error);
        }
    };

    const typesData = formatMethods(
        (
            selectors.find((selector) => 'MYME_TYPES' in selector) as
                | { MYME_TYPES: string[] }
                | undefined
        )?.MYME_TYPES || []
    );

    useEffect(() => {
        const enumTypes = enums.map((enumItem) => {
            return { label: enumItem.name, value: enumItem.name };
        });
        setEnumTypes(enumTypes);
    }, [enums]);

    useEffect(() => {
        const types = formatMethods(
            (
                selectors.find((selector) => 'SCHEMA_TYPES' in selector) as
                    | { SCHEMA_TYPES: string[] }
                    | undefined
            )?.SCHEMA_TYPES || []
        );

        setSchemaTypes(types);

        // Map DTO into the expected format
        const targetDto = dto.map((d) => ({
            value: d.content?.name || d.name,
            label: d.content?.name || d.name,
        }));

        setSchemaTypes((prevSchemaTypes) =>
            prevSchemaTypes.map((schemaType) =>
                schemaType.value === 'Reference other schemas'
                    ? { ...schemaType, value: 'dto', items: targetDto }
                    : schemaType
            )
        );
    }, [dto, selectors]);

    const onSubmit = async () => {
        const errors = await formik.validateForm();
        if (Object.keys(errors).length === 0) {
            if (name && module && module !== 'shared') {
                formik.handleSubmit();
            } else {
                setIsModalOpen(true);
            }
        } else {
            // Handle validation errors (optional)
            console.error('Validation errors:', errors);
        }
    };

    const onClickSourceCode = () => {
        initializeTabFromCurrentItem({
            path: `${currentItem.path}`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${currentItem.label}.json`,
        });
    };

    return (
        <React.Fragment>
            <NavigationBar
                onDelete={handleDelete}
                onSubmit={onSubmit}
                isNew={!data}
                title={title || t('createNewAction')}
                showSourceCode={onClickSourceCode}
                onClickBreadcrumbLink={() => setIsModalOpen(true)}
            />

            <CreateEndpointDialog
                isOpen={isModalOpen}
                basePath={basePath}
                mode="formik"
                modules={modules}
                defaultModule={module}
                pathController={pathController}
                endpointName={name}
                onConfirm={(values) => {
                    setName(values.name);
                    setPathController(values.basePath);
                    setModule(values.module);
                    formik.handleSubmit();
                }}
                onClose={() => setIsModalOpen(false)}
            />
            <div className="space-y-4 p-4">
                <Card className="rounded">
                    <CardHeader>
                        <CardTitle>{t('definition')}</CardTitle>
                        <CardDescription>
                            {t('controllerDefinition')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">
                            <div className="flex flex-col gap-3">
                                <LabelRequired>{t('methodType')}</LabelRequired>
                                <Combobox
                                    name={t('method')}
                                    placeholder={t('enterMethod')}
                                    value={formik.values.method}
                                    onChange={(value) =>
                                        formik.setFieldValue('method', value)
                                    }
                                    options={httpMethods}
                                    className="h-9 w-full"
                                />
                            </div>

                            <TextInput
                                id="path"
                                label={t('path')}
                                placeholder={'posts'}
                                value={formik.values.path}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                    formik.errors.path && formik.touched.path
                                        ? formik.errors.path
                                        : ''
                                }
                            />

                            <TextInput
                                id={'actionName'}
                                label={t('actionName')}
                                placeholder={'getPosts'}
                                value={formik.values.actionName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                    formik.errors.actionName &&
                                    formik.touched.actionName
                                        ? formik.errors.actionName
                                        : ''
                                }
                                isRequired
                            />
                        </div>
                    </CardContent>
                </Card>
                <Tabs defaultValue={'request'}>
                    <TabsList className="grid w-full grid-cols-4">
                        {TabList.map(({ label, tabId }, key) => (
                            <TabsTrigger key={key} value={tabId}>
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value={'request'}>
                        <TabRequest
                            formik={formik}
                            tablesColumns={tablesColumns}
                            contentTypes={typesData}
                            schemaTypes={schemaTypes}
                        />
                    </TabsContent>
                    <TabsContent value={'response'}>
                        <TabResponse
                            formik={formik}
                            schemaTypes={schemaTypes}
                            contentTypes={typesData}
                            responseTypes={responses}
                            enumTypes={enumTypes}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </React.Fragment>
    );
};

export default ControllerLayout;
